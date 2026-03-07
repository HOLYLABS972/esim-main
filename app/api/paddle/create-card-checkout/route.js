import { NextResponse } from 'next/server';
import { getFirebaseAuth, getFirebaseFirestore } from '../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const PADDLE_API_BASE = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
  ? 'https://sandbox-api.paddle.com'
  : 'https://api.paddle.com';

function getPaddleApiKey() {
  return process.env.PADDLE_API_KEY || process.env.NEXT_PUBLIC_PDL_API_KEY;
}

/**
 * Proxy for mobile app: creates a Paddle card-checkout URL on the main domain (roamjet.net).
 * Expects Authorization: Bearer <firebase_id_token> and body: { userId, email, successUrl, cancelUrl }.
 * Returns { checkoutUrl } (no redirect).
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing Authorization: Bearer <token>' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      const auth = await getFirebaseAuth();
      decoded = await auth.verifyIdToken(idToken);
    } catch (e) {
      console.error('Firebase token verification failed:', e.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const uid = decoded.uid;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const email = body.email ?? decoded.email ?? '';
    const successUrl = body.successUrl || 'https://roamjet.net/add-card-success';
    const cancelUrl = body.cancelUrl || 'https://roamjet.net/add-card-cancel';

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      );
    }

    const apiKey = getPaddleApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Paddle API key not configured. Set PADDLE_API_KEY.' },
        { status: 500 }
      );
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    const db = await getFirebaseFirestore();
    const paddleRef = db.collection('users').doc(uid).collection('paddle').doc('customer');
    let customerId = null;
    const cached = await paddleRef.get();
    if (cached.exists && cached.data()?.customer_id) {
      customerId = cached.data().customer_id;
    }

    if (!customerId) {
      const searchRes = await fetch(
        `${PADDLE_API_BASE}/customers?${new URLSearchParams({ email: email.trim() })}`,
        { headers }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const data = searchData.data || [];
        if (data.length > 0) {
          customerId = data[0].id;
          await paddleRef.set({ customer_id: customerId, email: email.trim() }, { merge: true });
        }
      }
      if (!customerId) {
        const createRes = await fetch(`${PADDLE_API_BASE}/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: email.trim(),
            custom_data: { firebase_uid: uid },
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
        await paddleRef.set({ customer_id: customerId, email: email.trim() }, { merge: true });
      }
    }

    const checkoutPayload = {
      items: [
        {
          price: {
            description: 'Card verification — $1 hold (refundable)',
            unit_price: {
              amount: '100',
              currency_code: 'USD',
            },
          },
          quantity: 1,
        },
      ],
      customer_id: customerId,
      collection_mode: 'automatic',
      checkout: {
        url: successUrl,
      },
      custom_data: {
        firebase_uid: uid,
        purpose: 'card_save',
      },
    };

    const txnRes = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(checkoutPayload),
    });

    if (!txnRes.ok) {
      const errText = await txnRes.text();
      console.error('Paddle create transaction failed:', txnRes.status, errText);
      return NextResponse.json(
        { error: errText || 'Paddle checkout creation failed' },
        { status: txnRes.status >= 500 ? 502 : 400 }
      );
    }

    const txnData = await txnRes.json();
    const data = txnData.data || {};
    let checkoutUrl = data.checkout?.url;
    if (!checkoutUrl && data.id) {
      checkoutUrl = `https://checkout.paddle.com/checkout/custom?_ptxn=${data.id}`;
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
