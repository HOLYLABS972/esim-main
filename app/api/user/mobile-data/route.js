import { NextResponse } from 'next/server';
import { getAiraloAccessToken } from '../../../lib/airaloAuth';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Mobile data API endpoint is active', method: 'POST' });
}

export async function POST(request) {
  try {
    let body;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400, headers: corsHeaders }); }

    const { iccid } = body || {};
    if (!iccid) return NextResponse.json({ success: false, error: 'iccid is required' }, { status: 400, headers: corsHeaders });

    const accessToken = await getAiraloAccessToken();

    const usageResponse = await fetch(`https://partners-api.airalo.com/v2/sims/${iccid}/usage`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });

    if (usageResponse.status === 404) {
      return NextResponse.json({ success: false, error: `No data found for ICCID: ${iccid}` }, { status: 404, headers: corsHeaders });
    }

    if (!usageResponse.ok) {
      const errorText = await usageResponse.text();
      return NextResponse.json({ success: false, error: `Airalo API error: ${usageResponse.status}` }, { status: usageResponse.status, headers: corsHeaders });
    }

    const usageData = await usageResponse.json();
    const simData = usageData.data;
    if (!simData) {
      return NextResponse.json({ success: false, error: `No data found for ICCID: ${iccid}` }, { status: 404, headers: corsHeaders });
    }

    const totalMb = parseFloat(simData.total || 0);
    const remainingMb = parseFloat(simData.remaining || 0);
    const usedMb = totalMb - remainingMb;

    return NextResponse.json({
      success: true,
      data: {
        iccid,
        status: (simData.status || 'active').toUpperCase(),
        dataUsed: `${Math.round(usedMb)}MB`,
        dataRemaining: `${Math.round(remainingMb)}MB`,
        dataTotal: `${Math.round(totalMb)}MB`,
        usagePercentage: totalMb > 0 ? Math.round(usedMb / totalMb * 10000) / 100 : 0,
        expiresAt: simData.expired_at || '',
      },
      isTestMode: false,
    }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('❌ Error in mobile-data endpoint:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
