import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PADDLE_API_BASE = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
  ? 'https://sandbox-api.paddle.com'
  : 'https://api.paddle.com';

function getPaddleApiKey() {
  return process.env.PADDLE_API_KEY || process.env.NEXT_PUBLIC_PDL_API_KEY;
}

export async function GET(request) {
  try {
    const apiKey = getPaddleApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Paddle API key not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const txnId = searchParams.get('txn') || searchParams.get('transaction_id');
    if (!txnId) {
      return NextResponse.json({ error: 'Missing txn or transaction_id' }, { status: 400 });
    }

    const res = await fetch(`${PADDLE_API_BASE}/transactions/${txnId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: errText || 'Transaction not found' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const txn = data.data;
    if (!txn) {
      return NextResponse.json({ error: 'Invalid response' }, { status: 500 });
    }

    const customData = txn.custom_data || {};
    const details = txn.details;
    const totalAmount = details?.totals?.total ? String(details.totals.total) : null;
    const items = txn.items || [];
    const quantity = items.length > 0
      ? items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
      : 1;

    return NextResponse.json({
      transactionId: txn.id,
      status: txn.status,
      totalAmount: totalAmount,
      quantity: Math.max(1, quantity),
      customData: {
        orderId: customData.orderId,
        planId: customData.planId,
        planName: customData.planName,
        customerEmail: customData.customerEmail,
        type: customData.type,
        userId: customData.userId,
        isGuest: customData.isGuest,
        affiliateRef: customData.affiliateRef,
        iccid: customData.iccid,
      },
    });
  } catch (e) {
    console.error('Paddle get transaction error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}
