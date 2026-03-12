import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PADDLE_API_BASE = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
  ? 'https://sandbox-api.paddle.com'
  : 'https://api.paddle.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhpuqiptxcjluwsetoev.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getPaddleApiKey() {
  return process.env.PADDLE_API_KEY || process.env.NEXT_PUBLIC_PDL_API_KEY;
}

export async function POST(request) {
  try {
    const apiKey = getPaddleApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Paddle API key not configured. Set PADDLE_API_KEY or NEXT_PUBLIC_PDL_API_KEY.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { orderData, successUrl, cancelUrl } = body;
    const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

    if (!orderData || orderData.amount == null) {
      return NextResponse.json({ error: 'Missing orderData or amount' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/$/, '') || '';
    const baseSuccess = successUrl || `${origin}/payment-success`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin || 'https://roamjet.net';
    // Paddle docs: pass checkout.url to override the domain for the payment link.
    // After payment (including Apple Pay), Paddle redirects to this URL + ?_ptxn=txn_xxx.
    // https://developer.paddle.com/api-reference/transactions/create-transaction (checkout.url)
    const successCallbackUrl = `${baseUrl.replace(/\/$/, '')}/payment-success`;

    const currency = (orderData.currency || 'usd').toUpperCase();
    const amountCents = Math.round(parseFloat(orderData.amount) * 100);
    const amountStr = String(amountCents);
    const planName = orderData.planName || 'eSIM Plan';
    const countryLabel = orderData.countryName || (orderData.countryCode ? `(${orderData.countryCode})` : null);
    const itemTitle = countryLabel ? `${planName} · ${countryLabel}` : planName;

    const payload = {
      items: [
        {
          quantity: 1,
          price: {
            description: planName,
            name: 'eSIM',
            unit_price: {
              amount: amountStr,
              currency_code: currency,
            },
            product: {
              name: itemTitle,
              tax_category: 'standard',
            },
          },
        },
      ],
      currency_code: currency,
      collection_mode: 'automatic',
      checkout: {
        url: successCallbackUrl,
      },
      custom_data: {
        orderId: orderData.orderId,
        orderID: orderData.orderId,
        planId: orderData.planId,
        planName: orderData.planName,
        customerEmail: orderData.customerEmail,
        type: orderData.type || 'esim',
        userId: orderData.userId || null,
        isGuest: orderData.isGuest ?? !orderData.userId,
        affiliateRef: orderData.affiliateRef || null,
        iccid: orderData.iccid || null,
        country: orderData.country || orderData.countryCode || null,
        countryCode: orderData.countryCode || orderData.country || null,
        countryName: orderData.countryName || null,
      },
    };

    const res = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errJson;
      try {
        errJson = JSON.parse(errText);
      } catch (_) {
        errJson = {};
      }
      const errDetail = errJson?.error?.detail || errJson?.error?.code || errText;
      if (errJson?.error?.code === 'transaction_default_checkout_url_not_set') {
        console.error('Paddle: Default Payment Link not set. Set it in Paddle Dashboard → Checkout → Checkout settings → Default payment link.');
        return NextResponse.json(
          {
            error: 'Paddle checkout is not fully configured. Please set a Default Payment Link in your Paddle Dashboard: Checkout → Checkout settings → Default payment link.',
            code: 'transaction_default_checkout_url_not_set',
          },
          { status: 503 }
        );
      }
      console.error('Paddle create transaction error:', res.status, errText);
      return NextResponse.json(
        { error: errDetail || 'Paddle API error' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const txn = data.data;
    if (!txn || !txn.id) {
      return NextResponse.json({ error: 'Invalid Paddle response' }, { status: 500 });
    }

    const orderId = orderData.orderId || `roamjet-${Date.now()}`;
    const checkoutUrl = `${baseUrl.replace(/\/$/, '')}/checkout?_ptxn=${encodeURIComponent(txn.id)}`;

    if (supabase) {
      const pendingOrder = {
        id: orderId,
        order_id: orderId,
        user_id: orderData.userId || null,
        customer_email: orderData.customerEmail || null,
        plan_id: orderData.planId || null,
        plan_name: orderData.planName || 'eSIM Plan',
        amount: parseFloat(orderData.amount) || 0,
        currency: currency.toLowerCase(),
        payment_method: 'paddle',
        status: 'pending',
        transaction_id: txn.id,
        paddle_transaction_id: txn.id,
        country_code: orderData.countryCode || orderData.country || null,
        country_name: orderData.countryName || null,
        is_guest: orderData.isGuest ?? !orderData.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('orders')
        .upsert(pendingOrder, { onConflict: 'id' });

      if (dbError) {
        console.error('Failed to create pending order:', dbError);
        return NextResponse.json(
          { error: 'Failed to create pending order' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      transactionId: txn.id,
      checkoutUrl,
      orderId,
      status: txn.status,
    });
  } catch (e) {
    console.error('Paddle create-transaction error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to create Paddle transaction' },
      { status: 500 }
    );
  }
}
