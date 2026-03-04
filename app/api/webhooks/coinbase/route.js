import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const AIRALO_BASE = 'https://partners-api.airalo.com/v2';
const AIRALO_CLIENT_ID = process.env.AIRALO_CLIENT_ID;
const AIRALO_CLIENT_SECRET = process.env.AIRALO_CLIENT_SECRET;
const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhpuqiptxcjluwsetoev.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback: country code → name when Airalo and metadata don't provide country_name
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
  if (!res.ok) throw new Error(data?.message || `Airalo error ${res.status}`);
  return data.data;
}

function verifySignature(rawBody, signature, secret) {
  if (!secret) return true; // skip if not configured
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const hash = hmac.update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-cc-webhook-signature') || '';

    console.log('🔔 Coinbase webhook received');

    // Verify signature
    if (COINBASE_WEBHOOK_SECRET && !verifySignature(rawBody, signature, COINBASE_WEBHOOK_SECRET)) {
      console.error('❌ Invalid Coinbase webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    console.log(`📦 Coinbase event: ${eventType}`);

    // Only process confirmed/resolved charges
    if (eventType !== 'charge:confirmed' && eventType !== 'charge:resolved') {
      console.log(`⏭️ Skipping event: ${eventType}`);
      return NextResponse.json({ received: true });
    }

    const charge = event.data;
    const metadata = charge.metadata || {};
    const orderId = metadata.order_id || metadata.orderId;
    const planId = metadata.plan_id || metadata.planId;
    const customerEmail = metadata.customer_email || metadata.customerEmail || metadata.email;
    const userId = metadata.user_id || metadata.userId;
    const planName = metadata.plan_name || metadata.planName;
    const isTopup = metadata.type === 'topup';
    const quantity = Math.max(1, Number(metadata.quantity) || 1);
    const countryCode = metadata.country_code || metadata.countryCode || null;
    const countryName = metadata.country_name || metadata.countryName || null;

    // Get amount from pricing
    const pricing = charge.pricing || {};
    const localPrice = pricing.local || {};
    const amount = parseFloat(localPrice.amount) || 0;
    const currency = (localPrice.currency || 'usd').toLowerCase();

    console.log(`📋 Order: ${orderId} | Plan: ${planId} | Email: ${customerEmail} | $${amount}`);

    if (!planId) {
      console.error('❌ No planId in charge metadata:', metadata);
      return NextResponse.json({ error: 'No planId in metadata' }, { status: 400 });
    }

    const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

    // Resolve planId to Airalo package slug (metadata may contain internal id from Checkout)
    let airaloPackageId = planId;
    if (supabase) {
      const byId = await supabase.from('dataplans').select('slug').eq('id', planId).limit(1).maybeSingle();
      const planRow = byId.data ?? (await supabase.from('dataplans').select('slug').eq('slug', planId).limit(1).maybeSingle()).data;
      if (planRow?.slug) {
        airaloPackageId = planRow.slug;
        if (airaloPackageId !== planId) console.log(`📌 Resolved planId ${planId} → Airalo slug ${airaloPackageId}`);
      }
    }

    // Idempotency check
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

    if (isTopup) {
      console.log('⏭️ Topup order — skipping Airalo provisioning');
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

    const airaloCountryCode = airaloOrder?.country_code || countryCode || null;
    let airaloCountryName = airaloOrder?.country_name || countryName || null;
    if (!airaloCountryName && airaloCountryCode) {
      airaloCountryName = COUNTRY_CODE_TO_NAME[String(airaloCountryCode).toUpperCase()] || null;
    }

    const basePlanName = planName || planId;
    const planDisplayName = (basePlanName && (airaloCountryName || airaloCountryCode))
      ? `${basePlanName} · ${airaloCountryName || `(${airaloCountryCode})`}`
      : basePlanName;

    console.log(`✅ Airalo order: ${airaloOrder.id} | ICCID: ${iccid}`);

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
        currency: currency,
        payment_method: 'coinbase',
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
        is_guest: !userId,
        airalo_order_data: { sims, order: airaloOrder, coinbase_charge: charge.code },
        created_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase.from('orders').upsert(orderRecord, { onConflict: 'id' });
      if (dbError) {
        console.error('⚠️ Supabase error:', dbError);
      } else {
        console.log('💾 Order saved to Supabase');
      }
    }

    return NextResponse.json({
      received: true,
      orderId,
      airaloOrderId: airaloOrder.id,
      iccid,
    });
  } catch (e) {
    console.error('❌ Coinbase webhook error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
