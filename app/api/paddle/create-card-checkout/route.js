import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * No-auth proxy: forwards request to Firebase callable. Firebase validates the token.
 * Project ID from FIREBASE_PROJECT_ID or from token "aud" (no Vercel auth config needed).
 */
function getProjectIdFromToken(idToken) {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    let payload = parts[1];
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = payload.length % 4;
    if (pad) payload += '===='.slice(0, 4 - pad);
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const data = JSON.parse(decoded);
    return data.aud || data.firebase?.project_id || null;
  } catch {
    return null;
  }
}

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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || getProjectIdFromToken(idToken);
    if (!projectId) {
      return NextResponse.json(
        { error: 'Set FIREBASE_PROJECT_ID on Vercel, or send a valid Firebase ID token' },
        { status: 503 }
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
