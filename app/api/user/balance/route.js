import { NextResponse } from 'next/server';
import { getAiraloAccessToken } from '../../../lib/airaloAuth';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request) {
  try {
    const accessToken = await getAiraloAccessToken();

    const balanceResponse = await fetch('https://partners-api.airalo.com/v2/balance', {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });

    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      return NextResponse.json({ success: false, error: `Airalo API error: ${balanceResponse.status}` }, { status: balanceResponse.status, headers: corsHeaders });
    }

    const balanceData = await balanceResponse.json();
    const balanceInfo = balanceData.data;
    if (!balanceInfo) {
      return NextResponse.json({ success: false, error: 'Invalid response from Airalo API' }, { status: 500, headers: corsHeaders });
    }

    const balance = parseFloat(balanceInfo.balance || 0);
    const minimumRequired = parseFloat(balanceInfo.minimum_required || 4.0);

    return NextResponse.json({
      success: true,
      balance,
      hasInsufficientFunds: balance < minimumRequired,
      minimumRequired,
      mode: 'production',
    }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
