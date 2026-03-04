import { NextResponse } from 'next/server';

const COINBASE_COMMERCE_API_URL = 'https://api.commerce.coinbase.com';

function getCoinbaseApiKey() {
  const key = process.env.COINBASE_API_KEY || process.env.NEXT_PUBLIC_COINBASE_API_KEY || process.env.COINBASE_PRIVATE_KEY || process.env.COINBASE_COMMERCE_API_KEY;
  return key ? key.trim() : null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderData } = body;

    if (!orderData) {
      return NextResponse.json({ error: 'Missing orderData' }, { status: 400 });
    }

    const apiKey = getCoinbaseApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Coinbase API key not configured. Set COINBASE_API_KEY in env.' }, { status: 500 });
    }

    const baseRedirectUrl = body.redirectUrl || `${request.headers.get('origin') || 'https://store.roamjet.net'}/payment-success`;
    const redirectParams = new URLSearchParams({
      order_id: orderData.orderId,
      email: orderData.customerEmail,
      total: orderData.amount.toString(),
      currency: orderData.currency || 'USD',
      payment_method: 'coinbase'
    });

    const chargeData = {
      name: orderData.planName || 'eSIM Plan',
      description: `eSIM data plan purchase - ${orderData.planName}`,
      local_price: {
        amount: parseFloat(orderData.amount || 0).toFixed(2),
        currency: orderData.currency || 'USD'
      },
      pricing_type: 'fixed_price',
      metadata: {
        order_id: orderData.orderId,
        plan_id: orderData.planId,
        plan_name: orderData.planName || null,
        customer_email: orderData.customerEmail,
        source: 'esim_shop',
        user_id: orderData.userId || null,
        country_code: orderData.countryCode || orderData.country || null,
        country_name: orderData.countryName || null,
        quantity: orderData.quantity != null ? String(orderData.quantity) : '1',
      },
      redirect_url: `${baseRedirectUrl}?${redirectParams.toString()}`,
      cancel_url: `${request.headers.get('origin') || 'https://store.roamjet.net'}/checkout`
    };

    const response = await fetch(`${COINBASE_COMMERCE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(chargeData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Coinbase API error:', errorText);
      return NextResponse.json({ error: `Coinbase API error: ${response.status} - ${errorText}` }, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Coinbase charge created:', result.data?.code);

    return NextResponse.json({ success: true, charge: result.data });
  } catch (error) {
    console.error('❌ Error creating Coinbase charge:', error);
    return NextResponse.json({ error: error.message || 'Failed to create charge' }, { status: 500 });
  }
}
