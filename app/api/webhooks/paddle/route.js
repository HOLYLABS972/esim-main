import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const AIRALO_BASE = 'https://partners-api.airalo.com/v2';
const AIRALO_CLIENT_ID = process.env.AIRALO_CLIENT_ID;
const AIRALO_CLIENT_SECRET = process.env.AIRALO_CLIENT_SECRET;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || process.env.NEXT_PUBLIC_PDL_API_KEY;
const PADDLE_API_BASE = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
  ? 'https://sandbox-api.paddle.com'
  : 'https://api.paddle.com';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhpuqiptxcjluwsetoev.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback: country code → name when Airalo and custom_data don't provide country_name
const COUNTRY_CODE_TO_NAME = {
  AE: 'United Arab Emirates', MX: 'Mexico', US: 'United States', GB: 'United Kingdom',
  DE: 'Germany', FR: 'France', ES: 'Spain', IT: 'Italy', CA: 'Canada', AU: 'Australia',
  JP: 'Japan', KR: 'South Korea', IN: 'India', BR: 'Brazil', TR: 'Turkey', EG: 'Egypt',
  SA: 'Saudi Arabia', TH: 'Thailand', SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia',
  PH: 'Philippines', VN: 'Vietnam', PL: 'Poland', NL: 'Netherlands', BE: 'Belgium',
  CH: 'Switzerland', AT: 'Austria', PT: 'Portugal', IE: 'Ireland', NZ: 'New Zealand',
  GR: 'Greece', CZ: 'Czech Republic', RO: 'Romania', HU: 'Hungary', SE: 'Sweden',
  NO: 'Norway', DK: 'Denmark', FI: 'Finland', IL: 'Israel', ZA: 'South Africa',
};

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

async function createAiraloOrder(token, packageId, quantity = 1, email = null) {
  const formData = new FormData();
  formData.append('package_id', String(packageId));
  formData.append('quantity', String(quantity));
  formData.append('type', 'sim');
  if (email) {
    formData.append('description', `eSIM order for ${email}`);
    formData.append('to_email', email);
    formData.append('sharing_option[]', 'link');
  }
  const res = await fetch(`${AIRALO_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.meta?.message || data?.errors?.[0]?.detail || `Airalo error ${res.status}`;
    console.error('❌ Airalo order failed:', res.status, JSON.stringify(data));
    throw new Error(msg);
  }
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

async function getPaddleCustomerEmail(customerId) {
  if (!PADDLE_API_KEY || !customerId) return null;
  try {
    const res = await fetch(`${PADDLE_API_BASE}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${PADDLE_API_KEY}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.email ?? null;
  } catch {
    return null;
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
    let customerEmail = customData.customerEmail;
    const userId = customData.userId;
    const isGuest = customData.isGuest;
    const affiliateRef = customData.affiliateRef;
    const planName = customData.planName;
    const country = customData.country || customData.countryCode;
    const countryCode = customData.countryCode || customData.country;
    const countryName = customData.countryName || customData.country_name;
    const isTopup = customData.type === 'topup';
    const isVirtualCardTopup = customData.type === 'virtual_card_topup';

    // Virtual card top-up: trigger Firebase HTTP function to credit card (RoamJet has no Admin SDK).
    if (isVirtualCardTopup) {
      const triggerUrl = process.env.PADDLE_TOPUP_TRIGGER_URL || process.env.FIREBASE_PADDLE_TOPUP_TRIGGER_URL;
      if (triggerUrl) {
        try {
          const res = await fetch(triggerUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'paddle-signature': request.headers.get('paddle-signature') || '',
            },
            body: rawBody,
          });
          const text = await res.text();
          if (!res.ok) {
            console.error('❌ Paddle top-up trigger failed:', res.status, text);
            return NextResponse.json({ error: text || 'Trigger failed' }, { status: res.status });
          }
          console.log('✅ Virtual card top-up trigger succeeded:', res.status);
          return NextResponse.json({ received: true, type: 'virtual_card_topup' });
        } catch (err) {
          console.error('❌ Paddle top-up trigger error:', err);
          return NextResponse.json({ error: err.message }, { status: 500 });
        }
      }
      console.log('⏭️ Virtual card top-up (no PADDLE_TOPUP_TRIGGER_URL) — acknowledged only');
      return NextResponse.json({ received: true, type: 'virtual_card_topup' });
    }

    if (!customerEmail && txn.customer_id) {
      customerEmail = await getPaddleCustomerEmail(txn.customer_id);
      if (customerEmail) console.log(`📧 Got customer email from Paddle: ${customerEmail}`);
    }

    if (!planId) {
      console.error('❌ No planId in custom_data:', customData);
      return NextResponse.json({ error: 'No planId in custom_data' }, { status: 400 });
    }

    const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

    // Resolve planId to Airalo package slug (custom_data may contain internal id from Checkout)
    let airaloPackageId = planId;
    if (supabase) {
      const byId = await supabase.from('dataplans').select('slug').eq('id', planId).limit(1).maybeSingle();
      const planRow = byId.data ?? (await supabase.from('dataplans').select('slug').eq('slug', planId).limit(1).maybeSingle()).data;
      if (planRow?.slug) {
        airaloPackageId = planRow.slug;
        if (airaloPackageId !== planId) console.log(`📌 Resolved planId ${planId} → Airalo slug ${airaloPackageId}`);
      }
    }

    // Calculate amount
    const totalAmount = txn.details?.totals?.total;
    const amount = totalAmount ? parseInt(totalAmount, 10) / 100 : 0;

    // Quantity from transaction items (Paddle sends items[].quantity)
    const quantity = Math.max(1, Number(
      txn.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    ) || 1);

    console.log(`📦 Processing order: ${orderId} | Plan: ${planId} | Airalo slug: ${airaloPackageId} | Email: ${customerEmail} | Qty: ${quantity} | Amount: $${amount}`);

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
    const airaloOrder = await createAiraloOrder(token, airaloPackageId, quantity, customerEmail);

    const sims = airaloOrder?.sims || [];
    const firstSim = sims[0] || {};
    const qrCode = firstSim.qrcode || firstSim.qrcode_url || null;
    const iccid = firstSim.iccid || null;
    const smdpAddress = firstSim.lpa || firstSim.smdp_address || null;
    const activationCode = firstSim.matching_id || firstSim.activation_code || null;
    const appleInstallUrl = firstSim.direct_apple_installation_url || null;

    // Extract country from Airalo response or custom_data; fallback code→name when missing
    const airaloCountryCode = airaloOrder?.country_code || countryCode || null;
    let airaloCountryName = airaloOrder?.country_name || countryName || null;
    if (!airaloCountryName && airaloCountryCode) {
      airaloCountryName = COUNTRY_CODE_TO_NAME[String(airaloCountryCode).toUpperCase()] || null;
    }

    const basePlanName = planName || planId;
    const planDisplayName = (basePlanName && (airaloCountryName || airaloCountryCode))
      ? `${basePlanName} · ${airaloCountryName || `(${airaloCountryCode})`}`
      : basePlanName;

    console.log(`✅ Airalo order created: ${airaloOrder.id} | ICCID: ${iccid} | Country: ${airaloCountryCode}`);

    // Save to Supabase
    if (supabase) {
      const orderRecord = {
        id: orderId || `roamjet-${Date.now()}`,
        order_id: orderId || `roamjet-${Date.now()}`,
        user_id: userId || null,
        customer_email: customerEmail || null,
        plan_id: planId,
        plan_name: planDisplayName,
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
        country_code: airaloCountryCode,
        country_name: airaloCountryName,
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
