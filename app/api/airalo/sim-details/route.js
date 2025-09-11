import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { iccid, include = 'order,order.status,order.user,share' } = body;

    console.log('📱 SIM Details API called with ICCID:', iccid);

    if (!iccid) {
      console.log('❌ No ICCID provided');
      return NextResponse.json({
        success: false,
        error: 'ICCID is required'
      }, { status: 400 });
    }

    // Get Airalo credentials from Firestore
    const airaloConfigRef = doc(db, 'config', 'airalo');
    const airaloConfig = await getDoc(airaloConfigRef);
    
    if (!airaloConfig.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Airalo configuration not found'
      }, { status: 400 });
    }
    
    const configData = airaloConfig.data();
    const clientId = configData.api_key;
    const clientSecret = process.env.AIRALO_CLIENT_SECRET_PRODUCTION;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Airalo credentials not found'
      }, { status: 400 });
    }

    // Authenticate with Airalo API
    const baseUrl = 'https://partners-api.airalo.com';
    const authResponse = await fetch(`${baseUrl}/v2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`Authentication failed: ${authResponse.statusText} - ${errorText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.data?.access_token;

    if (!accessToken) {
      throw new Error('No access token received from Airalo API');
    }

    console.log('✅ Successfully authenticated with Airalo API');

    // Get eSIM details using ICCID
    console.log('📱 Fetching eSIM details for ICCID:', iccid);
    const simResponse = await fetch(`${baseUrl}/v2/sims/${iccid}?include=${include}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    console.log('📱 SIM details response status:', simResponse.status, simResponse.statusText);

    if (!simResponse.ok) {
      const errorText = await simResponse.text();
      console.log('📱 SIM details error:', errorText);
      return NextResponse.json({
        success: false,
        error: `Failed to get eSIM details: ${simResponse.statusText} - ${errorText}`,
        statusCode: simResponse.status
      }, { status: simResponse.status });
    }

    const simDetails = await simResponse.json();
    console.log('✅ Got eSIM details from Airalo:', simDetails);

    return NextResponse.json({
      success: true,
      data: simDetails.data,
      meta: simDetails.meta,
      message: 'eSIM details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting eSIM details:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
