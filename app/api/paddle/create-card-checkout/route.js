import { NextResponse } from 'next/server';
import { getFirebaseAuth, getFirebaseProjectId } from '../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Proxy for mobile app: verifies Firebase token, then calls the existing
 * Firebase callable create_paddle_card_checkout_url. Vercel is frontend-only;
 * all Paddle logic stays in Firebase.
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

    try {
      const auth = await getFirebaseAuth();
      await auth.verifyIdToken(idToken);
    } catch (e) {
      console.error('Firebase token verification failed:', e.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const projectId = await getFirebaseProjectId();
    if (!projectId) {
      return NextResponse.json(
        { error: 'Firebase project not configured' },
        { status: 500 }
      );
    }

    const region = process.env.FIREBASE_FUNCTIONS_REGION || 'us-central1';
    const url = `https://${region}-${projectId}.cloudfunctions.net/create_paddle_card_checkout_url`;

    const callableBody = {
      data: {
        userId: body.userId,
        email: body.email,
        successUrl: body.successUrl || 'https://roamjet.net/add-card-success',
        cancelUrl: body.cancelUrl || 'https://roamjet.net/add-card-cancel',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(callableBody),
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error('Firebase callable response not JSON:', text?.slice(0, 200));
      return NextResponse.json(
        { error: 'Invalid response from function' },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.message || text || `Function error ${res.status}`;
      return NextResponse.json(
        { error: errMsg },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const result = data.result;
    const checkoutUrl = result?.checkoutUrl || result?.url;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'No checkout URL in function result' },
        { status: 502 }
      );
    }

    return NextResponse.json({ checkoutUrl });
  } catch (e) {
    console.error('create-card-checkout proxy error:', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
