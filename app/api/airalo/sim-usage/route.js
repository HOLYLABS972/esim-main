import { NextResponse } from 'next/server';
import { getAiraloAccessToken, AIRALO_BASE_URL } from '../../../lib/airaloAuth';

export async function POST(request) {
  try {
    const { iccid } = await request.json();
    if (!iccid) return NextResponse.json({ success: false, error: 'ICCID is required' }, { status: 400 });

    const accessToken = await getAiraloAccessToken();

    const usageResponse = await fetch(`${AIRALO_BASE_URL}/v2/sims/${iccid}/usage`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });

    if (!usageResponse.ok) {
      const errorText = await usageResponse.text();
      if (usageResponse.status === 404) {
        return NextResponse.json({ success: false, error: 'Invalid ICCID - eSIM not found' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: `Failed to get usage data: ${usageResponse.statusText} - ${errorText}` }, { status: usageResponse.status });
    }

    const usageData = await usageResponse.json();

    return NextResponse.json({
      success: true,
      data: usageData.data,
      meta: usageData.meta,
      message: 'Usage data retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting usage data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
