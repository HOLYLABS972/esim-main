import { NextResponse } from 'next/server';

const PADDLE_API_BASE = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
  ? 'https://sandbox-api.paddle.com'
  : 'https://api.paddle.com';

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

    if (!orderData || orderData.amount == null) {
      return NextResponse.json({ error: 'Missing orderData or amount' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/$/, '') || '';
    const baseSuccess = successUrl || `${origin}/payment-success`;
    const currency = (orderData.currency || 'usd').toUpperCase();
    const amountCents = Math.round(parseFloat(orderData.amount) * 100);
    const amountStr = String(amountCents);

    const payload = {
      items: [
        {
          quantity: 1,
          price: {
            description: orderData.planName || 'eSIM data plan',
            name: orderData.planName || 'eSIM Plan',
            unit_price: {
              amount: amountStr,
              currency_code: currency,
            },
            product: {
              name: orderData.planName || 'eSIM Plan',
              tax_category: 'standard',
            },
          },
        },
      ],
      currency_code: currency,
      collection_mode: 'automatic',
      custom_data: {
        orderId: orderData.orderId,
        planId: orderData.planId,
        planName: orderData.planName,
        customerEmail: orderData.customerEmail,
        type: orderData.type || 'esim',
        userId: orderData.userId || null,
        isGuest: orderData.isGuest ?? !orderData.userId,
        affiliateRef: orderData.affiliateRef || null,
        iccid: orderData.iccid || null,
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
      console.error('Paddle create transaction error:', res.status, errText);
      return NextResponse.json(
        { error: errText || 'Paddle API error' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const txn = data.data;
    if (!txn || !txn.id) {
      return NextResponse.json({ error: 'Invalid Paddle response' }, { status: 500 });
    }

    const checkoutUrl = txn.checkout?.url;
    return NextResponse.json({
      transactionId: txn.id,
      checkoutUrl: checkoutUrl || null,
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
