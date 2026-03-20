import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PADDLE_API_BASE = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
  ? 'https://sandbox-api.paddle.com'
  : 'https://api.paddle.com';

function getPaddleApiKey() {
  return (
    process.env.PADDLE_API_KEY ||
    process.env.NEXT_PUBLIC_PDL_API_KEY ||
    process.env.NEXT_PUBLIC_PADDLE_API_KEY ||
    process.env.PDL_API_KEY ||
    ''
  ).trim() || null;
}

/**
 * Create Paddle top-up checkout. No Firebase — just email, cardId, amount.
 * Body: { email, cardId, amount, userId?, successUrl?, cancelUrl? }
 */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = (body.email || '').toString().trim();
    const cardId = (body.cardId || '').toString().trim();
    const userId = (body.userId || '').toString().trim();
    const amountRaw = body.amount;

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }
    const amountNum = parseFloat(amountRaw);
    if (Number.isNaN(amountNum) || amountNum < 0.5) {
      return NextResponse.json({ error: 'Valid amount (min 0.5) is required' }, { status: 400 });
    }

    const apiKey = getPaddleApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Paddle API key not configured' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://roamjet.net';
    const successUrl = body.successUrl || `${baseUrl.replace(/\/$/, '')}/payment-success`;
    const cancelUrl = body.cancelUrl || `${baseUrl.replace(/\/$/, '')}/`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

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
          custom_data: { firebase_uid: userId || '', type: 'virtual_card_topup' },
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

    const amountCents = Math.round(amountNum * 100);
    const payload = {
      items: [
        {
          quantity: 1,
          price: {
            description: `$${amountNum.toFixed(2)}`,
            unit_price: {
              amount: String(amountCents),
              currency_code: 'USD',
            },
            product: {
              name: 'Virtual card top-up',
              tax_category: 'standard',
            },
          },
        },
      ],
      customer_id: customerId,
      currency_code: 'USD',
      collection_mode: 'automatic',
      checkout: { url: successUrl },
      custom_data: {
        firebase_uid: userId,
        type: 'virtual_card_topup',
        cardId,
      },
    };

    const txnRes = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!txnRes.ok) {
      const errText = await txnRes.text();
      console.error('Paddle create topup transaction failed:', txnRes.status, errText);
      let errDetail = errText;
      try {
        const errJson = JSON.parse(errText);
        errDetail = errJson?.error?.detail || errJson?.error?.code || errJson?.message || errText;
      } catch (_) {}
      return NextResponse.json(
        { error: errDetail || 'Paddle checkout failed' },
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
    console.error('create-topup-checkout error:', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
