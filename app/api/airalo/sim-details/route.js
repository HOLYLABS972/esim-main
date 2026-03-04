import { NextResponse } from 'next/server';
import { getAiraloAccessToken, AIRALO_BASE_URL } from '../../../lib/airaloAuth';

export async function POST(request) {
  try {
    const { iccid } = await request.json();
    if (!iccid) return NextResponse.json({ success: false, error: 'ICCID is required' }, { status: 400 });

    const accessToken = await getAiraloAccessToken();

    const simResponse = await fetch(`${AIRALO_BASE_URL}/v2/sims/${iccid}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });

    if (!simResponse.ok) {
      const errorText = await simResponse.text();
      return NextResponse.json({ success: false, error: `Failed to get eSIM details: ${simResponse.statusText} - ${errorText}` }, { status: simResponse.status });
    }

    const simDetails = await simResponse.json();
    const simData = simDetails.data;

    return NextResponse.json({
      success: true,
      data: {
        qrCode: simData?.qr_code,
        qrCodeUrl: simData?.qr_code_url,
        activationCode: simData?.activation_code,
        iccid: simData?.iccid,
        lpa: simData?.lpa,
        directAppleInstallationUrl: simData?.direct_apple_installation_url,
        matchingId: simData?.matching_id,
        status: simData?.status,
        packageName: simData?.package?.title,
        packageDetails: simData?.package
      },
      fullSimData: simData,
      message: 'eSIM details retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting eSIM details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
