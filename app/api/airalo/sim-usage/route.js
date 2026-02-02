import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { iccid } = body;

    console.log('📊 SIM Usage API called with ICCID:', iccid);

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

    // Get eSIM usage data using ICCID
    console.log('📊 Fetching usage data for ICCID:', iccid);
    const usageResponse = await fetch(`${baseUrl}/v2/sims/${iccid}/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    console.log('📊 Usage response status:', usageResponse.status, usageResponse.statusText);

    if (!usageResponse.ok) {
      const errorText = await usageResponse.text();
      console.log('📊 Usage error:', errorText);
      
      // Handle specific error cases
      if (usageResponse.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'Invalid ICCID - eSIM not found',
          statusCode: 404
        }, { status: 404 });
      } else if (usageResponse.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded - too many requests (100 requests per minute per ICCID)',
          statusCode: 429
        }, { status: 429 });
      } else {
        return NextResponse.json({
          success: false,
          error: `Failed to get usage data: ${usageResponse.statusText} - ${errorText}`,
          statusCode: usageResponse.status
        }, { status: usageResponse.status });
      }
    }

    const usageData = await usageResponse.json();
    console.log('✅ Got usage data from Airalo:', usageData);

    return NextResponse.json({
      success: true,
      data: usageData.data,
      meta: usageData.meta,
      message: 'Usage data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting usage data:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
