import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const AIRALO_BASE = 'https://partners-api.airalo.com/v2';
const AIRALO_CLIENT_ID = process.env.AIRALO_CLIENT_ID;
const AIRALO_CLIENT_SECRET = process.env.AIRALO_CLIENT_SECRET;

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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airalo auth failed: ${err}`);
  }

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
    body: JSON.stringify({
      package_id: packageId,
      quantity: quantity,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Airalo order error:', JSON.stringify(data));
    throw new Error(data?.message || data?.meta?.message || `Airalo API error ${res.status}`);
  }

  return data.data;
}

export async function POST(request) {
  try {
    if (!AIRALO_CLIENT_ID || !AIRALO_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Airalo API not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { package_id, planId, quantity, to_email, orderId, userId, planName, amount, currency, paymentMethod, isGuest, affiliateRef } = body;

    const pkgId = package_id || planId;
    if (!pkgId) {
      return NextResponse.json({ error: 'package_id is required' }, { status: 400 });
    }

    const qty = Math.max(1, parseInt(quantity) || 1);

    // 1. Get Airalo token
    const token = await getAiraloToken();

    // 2. Create Airalo order
    console.log(`📦 Creating Airalo order: ${pkgId} x${qty}`);
    const airaloOrder = await createAiraloOrder(token, pkgId, qty);

    const sims = airaloOrder?.sims || [];
    const firstSim = sims[0] || {};
    const qrCode = firstSim.qrcode || firstSim.qrcode_url || null;
    const iccid = firstSim.iccid || null;
    const smdpAddress = firstSim.lpa || firstSim.smdp_address || null;
    const activationCode = firstSim.matching_id || firstSim.activation_code || null;

    console.log(`✅ Airalo order created: ${airaloOrder.id}, ICCID: ${iccid}`);

    // 3. Save to Supabase
    if (SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      const orderRecord = {
        id: orderId || `roamjet-${Date.now()}`,
        order_id: orderId || `roamjet-${Date.now()}`,
        user_id: userId || null,
        customer_email: to_email || null,
        plan_id: pkgId,
        plan_name: planName || pkgId,
        amount: parseFloat(amount) || 0,
        currency: (currency || 'usd').toLowerCase(),
        payment_method: paymentMethod || 'paddle',
        status: 'active',
        airalo_order_id: String(airaloOrder.id),
        iccid: iccid,
        qr_code: qrCode,
        qr_code_url: qrCode,
        smdp_address: smdpAddress,
        activation_code: activationCode,
        lpa: smdpAddress,
        matching_id: activationCode,
        is_guest: isGuest ?? !userId,
        airalo_order_data: { sims, order: airaloOrder },
        created_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase.from('orders').insert(orderRecord);
      if (dbError) {
        console.error('⚠️ Failed to save order to Supabase:', dbError);
        // Don't fail — eSIM was already provisioned
      } else {
        console.log('💾 Order saved to Supabase');
      }
    }

    return NextResponse.json({
      success: true,
      orderId: orderId || airaloOrder.id,
      airaloOrderId: airaloOrder.id,
      iccid: iccid,
      qrCode: qrCode,
      smdpAddress: smdpAddress,
      activationCode: activationCode,
      orderData: airaloOrder,
      esimData: firstSim,
    });
  } catch (e) {
    console.error('❌ Order creation failed:', e);
    return NextResponse.json({ error: e.message || 'Failed to create order' }, { status: 500 });
  }
}
