import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const AIRALO_BASE = 'https://partners-api.airalo.com/v2';
const AIRALO_CLIENT_ID = process.env.AIRALO_CLIENT_ID;
const AIRALO_CLIENT_SECRET = process.env.AIRALO_CLIENT_SECRET;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhpuqiptxcjluwsetoev.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let airaloToken = null;
let airaloTokenExpiry = 0;

async function getAiraloToken() {
  if (airaloToken && Date.now() < airaloTokenExpiry) return airaloToken;
  const res = await fetch(`${AIRALO_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: AIRALO_CLIENT_ID,
      client_secret: AIRALO_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) throw new Error(`Airalo auth failed: ${await res.text()}`);
  const data = await res.json();
  airaloToken = data.data?.access_token;
  airaloTokenExpiry = Date.now() + (data.data?.expires_in || 3600) * 1000 - 60000;
  return airaloToken;
}

async function createAiraloOrder(token, packageId, quantity = 1) {
  const res = await fetch(`${AIRALO_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ package_id: packageId, quantity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Airalo error ${res.status}`);
  return data.data;
}

function verifyPaddleSignature(rawBody, signature) {
  if (!PADDLE_WEBHOOK_SECRET || !signature) return !PADDLE_WEBHOOK_SECRET; // skip if no secret configured
  try {
    const parts = {};
    signature.split(';').forEach(part => {
      const [key, val] = part.split('=');
      parts[key] = val;
    });
    const ts = parts['ts'];
    const h1 = parts['h1'];
    if (!ts || !h1) return false;
    const payload = `${ts}:${rawBody}`;
    const expected = crypto.createHmac('sha256', PADDLE_WEBHOOK_SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request) {
  let rawBody;
  try {
    rawBody = await request.text();
    const signature = request.headers.get('paddle-signature');

    // Verify signature if secret is configured
    if (PADDLE_WEBHOOK_SECRET && !verifyPaddleSignature(rawBody, signature)) {
      console.error('❌ Paddle webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type;

    console.log(`🔔 Paddle webhook: ${eventType}`);

    // Only process completed transactions
    if (eventType !== 'transaction.completed') {
      console.log(`⏭️ Skipping event: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    const txn = event.data;
    const customData = txn.custom_data || {};
    const orderId = customData.orderId || customData.orderID;
    const planId = customData.planId;
    const customerEmail = customData.customerEmail;
    const userId = customData.userId;
    const isGuest = customData.isGuest;
    const affiliateRef = customData.affiliateRef;
    const planName = customData.planName;
    const isTopup = customData.type === 'topup';

    if (!planId) {
      console.error('❌ No planId in custom_data:', customData);
      return NextResponse.json({ error: 'No planId in custom_data' }, { status: 400 });
    }

    // Calculate amount
    const totalAmount = txn.details?.totals?.total;
    const amount = totalAmount ? parseInt(totalAmount, 10) / 100 : 0;

    console.log(`📦 Processing order: ${orderId} | Plan: ${planId} | Email: ${customerEmail} | Amount: $${amount}`);

    const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

    // Idempotency: check if order already fulfilled
    if (supabase && orderId) {
      const { data: existing } = await supabase
        .from('orders')
        .select('id,status,airalo_order_id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (existing && existing.airalo_order_id) {
        console.log(`✅ Order ${orderId} already fulfilled (Airalo: ${existing.airalo_order_id})`);
        return NextResponse.json({ received: true, already_fulfilled: true });
      }
    }

    if (!AIRALO_CLIENT_ID || !AIRALO_CLIENT_SECRET) {
      console.error('❌ Airalo API not configured');
      return NextResponse.json({ error: 'Airalo not configured' }, { status: 500 });
    }

    // Skip topups for now — handle eSIM orders only
    if (isTopup) {
      console.log(`⏭️ Topup order — skipping Airalo provisioning`);
      return NextResponse.json({ received: true, type: 'topup' });
    }

    // Provision eSIM via Airalo
    const token = await getAiraloToken();
    const airaloOrder = await createAiraloOrder(token, planId, 1);

    const sims = airaloOrder?.sims || [];
    const firstSim = sims[0] || {};
    const qrCode = firstSim.qrcode || firstSim.qrcode_url || null;
    const iccid = firstSim.iccid || null;
    const smdpAddress = firstSim.lpa || firstSim.smdp_address || null;
    const activationCode = firstSim.matching_id || firstSim.activation_code || null;
    const appleInstallUrl = firstSim.direct_apple_installation_url || null;

    console.log(`✅ Airalo order created: ${airaloOrder.id} | ICCID: ${iccid}`);

    // Save to Supabase
    if (supabase) {
      const orderRecord = {
        id: orderId || `roamjet-${Date.now()}`,
        order_id: orderId || `roamjet-${Date.now()}`,
        user_id: userId || null,
        customer_email: customerEmail || null,
        plan_id: planId,
        plan_name: planName || planId,
        amount: amount,
        currency: (txn.currency_code || 'usd').toLowerCase(),
        payment_method: 'paddle',
        status: 'active',
        airalo_order_id: String(airaloOrder.id),
        iccid: iccid,
        qr_code: qrCode,
        qr_code_url: qrCode,
        smdp_address: smdpAddress,
        activation_code: activationCode,
        lpa: smdpAddress,
        matching_id: activationCode,
        direct_apple_installation_url: appleInstallUrl,
        is_guest: isGuest ?? !userId,
        airalo_order_data: { sims, order: airaloOrder, paddle_txn: txn.id },
        created_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase.from('orders').upsert(orderRecord, { onConflict: 'id' });
      if (dbError) {
        console.error('⚠️ Supabase insert error:', dbError);
      } else {
        console.log('💾 Order saved to Supabase');
      }
    }

    // TODO: Send QR code email to customer
    console.log(`📧 Should send QR to: ${customerEmail}`);

    return NextResponse.json({
      received: true,
      orderId: orderId,
      airaloOrderId: airaloOrder.id,
      iccid: iccid,
    });
  } catch (e) {
    console.error('❌ Paddle webhook error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
