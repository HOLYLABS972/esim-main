import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Same flow as website checkout: create Paddle transaction on roamjet.net, return checkout URL.
 * Uses the same Paddle API key as create-transaction (website checkout).
 */
const PADDLE_API_BASE = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
  ? 'https://sandbox-api.paddle.com'
  : 'https://api.paddle.com';

// Same key source as create-transaction and paddleService (website checkout)
function getPaddleApiKey() {
  return (
    process.env.PADDLE_API_KEY ||
    process.env.NEXT_PUBLIC_PDL_API_KEY ||
    process.env.NEXT_PUBLIC_PADDLE_API_KEY ||
    process.env.PDL_API_KEY ||
    ''
  ).trim() || null;
}

export async function POST(request) {
  try {
    const apiKey = getPaddleApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Paddle API key not configured. Set PADDLE_API_KEY or NEXT_PUBLIC_PDL_API_KEY on Vercel (same as website checkout).',
        },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = (body.email || '').toString().trim();
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    // Same success/cancel as website (approved domain)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://roamjet.net';
    const successUrl = body.successUrl || `${baseUrl.replace(/\/$/, '')}/payment-success`;
    const cancelUrl = body.cancelUrl || `${baseUrl.replace(/\/$/, '')}/`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    // 1) Get or create Paddle customer (by email) – same idea as website customer
    let customerId = null;
    const searchRes = await fetch(
      `${PADDLE_API_BASE}/customers?${new URLSearchParams({ email })}`,
      { headers }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const list = searchData.data || [];
      if (list.length > 0) customerId = list[0].id;
    }
    if (!customerId) {
      const createRes = await fetch(`${PADDLE_API_BASE}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          custom_data: { firebase_uid: body.userId || '', purpose: 'card_save' },
        }),
      });
      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error('Paddle create customer failed:', errText);
        return NextResponse.json(
          { error: 'Failed to create Paddle customer' },
          { status: 502 }
        );
      }
      const createData = await createRes.json();
      customerId = createData.data?.id;
      if (!customerId) {
        return NextResponse.json(
          { error: 'Invalid Paddle customer response' },
          { status: 502 }
        );
      }
    }

    // 2) Create transaction (same shape as website create-transaction, but $1 + customer_id so card is saved)
    const payload = {
      items: [
        {
          quantity: 1,
          price: {
            description: 'Card verification — $1 hold (refundable)',
            name: 'Card verification',
            unit_price: {
              amount: '100',
              currency_code: 'USD',
            },
            product: {
              name: 'Card verification',
              tax_category: 'standard',
            },
          },
        },
      ],
      customer_id: customerId,
      currency_code: 'USD',
      collection_mode: 'automatic',
      checkout: {
        url: successUrl,
      },
      custom_data: {
        type: 'card_save',
        customerEmail: email,
        userId: body.userId || null,
      },
    };

    const txnRes = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!txnRes.ok) {
      const errText = await txnRes.text();
      console.error('Paddle create transaction failed:', txnRes.status, errText);
      let errDetail = errText;
      try {
        const errJson = JSON.parse(errText);
        errDetail = errJson?.error?.detail || errJson?.error?.code || errJson?.message || errText;
        if (txnRes.status === 401 || txnRes.status === 403) {
          errDetail = `Paddle auth failed (${txnRes.status}). Use the same API key as website checkout (PADDLE_API_KEY or NEXT_PUBLIC_PDL_API_KEY). Paddle: ${errDetail}`;
        }
      } catch (_) {}
      return NextResponse.json(
        { error: errDetail || 'Paddle checkout creation failed' },
        { status: txnRes.status >= 500 ? 502 : 400 }
      );
    }

    const txnData = await txnRes.json();
    const txn = txnData.data || {};
    let checkoutUrl = txn.checkout?.url;
    if (!checkoutUrl && txn.id) {
      checkoutUrl = `https://checkout.paddle.com/checkout/custom?_ptxn=${txn.id}`;
    }
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'No checkout URL in Paddle response' },
        { status: 502 }
      );
    }

    return NextResponse.json({ checkoutUrl });
  } catch (e) {
    console.error('create-card-checkout error:', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
