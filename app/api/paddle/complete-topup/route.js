import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FUNCTIONS_URL = (process.env.FIREBASE_CLOUD_FUNCTIONS_URL || '').replace(/\/$/, '');

function getBearerToken(request) {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

/**
 * Proxy: POST with Authorization Bearer <firebase_id_token> and body { transactionId, cardId }.
 * Forwards to Firebase callable complete_virtual_card_topup so the app can complete top-up
 * without calling the function domain directly.
 */
export async function POST(request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Missing Authorization: Bearer <token>' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const transactionId = (body.transactionId || body.transaction_id || '').toString().trim();
    const cardId = (body.cardId || '').toString().trim();
    if (!transactionId || !cardId) {
      return NextResponse.json(
        { error: 'transactionId and cardId are required' },
        { status: 400 }
      );
    }

    if (!FUNCTIONS_URL) {
      console.error('FIREBASE_CLOUD_FUNCTIONS_URL not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 503 }
      );
    }

    const fnUrl = `${FUNCTIONS_URL}/complete_virtual_card_topup`;
    const response = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: { transactionId, cardId },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data.error?.message || data.message || response.statusText;
      return NextResponse.json(
        { error: msg || 'Complete top-up failed' },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    return NextResponse.json(data.result || data);
  } catch (e) {
    console.error('complete-topup proxy error:', e);
    return NextResponse.json(
      { error: 'Complete top-up service unavailable' },
      { status: 502 }
    );
  }
}
