import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    console.log('📱 QR Code API called with orderId:', orderId);

    if (!orderId) {
      console.log('❌ No orderId provided');
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    console.log('📱 Getting QR code for order:', orderId);

    // Get order from Firestore
    const orderRef = doc(db, 'orders', orderId);
    console.log('📱 Looking for order in Firestore at path:', `orders/${orderId}`);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      console.log('❌ Order not found in Firestore:', orderId);
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }
    
    console.log('✅ Order found in Firestore');

    const orderData = orderDoc.data();
    const airaloOrderId = orderData.airaloOrderId;

    // Check if QR code already exists and return it (allow multiple retrievals)
    if (orderData.qrCode && orderData.qrCodeRetrievedAt) {
      console.log('✅ QR code already exists, returning cached data');
      return NextResponse.json({
        success: true,
        qrCode: orderData.qrCode,
        qrCodeUrl: orderData.qrCodeUrl,
        activationCode: orderData.activationCode,
        iccid: orderData.iccid,
        lpa: orderData.lpa,
        matchingId: orderData.matchingId,
        orderStatus: orderData.orderStatus,
        orderDetails: orderData.airaloOrderDetails,
        simDetails: orderData.airaloSimDetails,
        directAppleInstallationUrl: orderData.directAppleInstallationUrl,
        smdpAddress: orderData.smdpAddress,
        message: 'QR code retrieved from cache (previously processed)',
        canRetry: false,
        canRetrieveMultipleTimes: true,
        fromCache: true
      });
    }

    if (!airaloOrderId) {
      return NextResponse.json({
        success: false,
        error: 'Airalo order ID not found'
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

    // Get order details from Airalo first
    console.log('📱 Fetching order details from Airalo API...');
    const orderResponse = await fetch(`${baseUrl}/v2/orders/${airaloOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    console.log('📱 Order details response status:', orderResponse.status, orderResponse.statusText);

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`Failed to get order details: ${orderResponse.statusText} - ${errorText}`);
    }

    const orderDetails = await orderResponse.json();
    console.log('✅ Got order details from Airalo:', orderDetails);

    // Extract SIM ICCID from order details
    const sims = orderDetails.data?.sims;
    if (!sims || !Array.isArray(sims) || sims.length === 0) {
      console.log('📱 No SIMs found in order details');
      return NextResponse.json({
        success: false,
        error: 'No SIMs found in order. The order may still be processing.',
        orderDetails: orderDetails.data,
        canRetry: true
      }, { status: 400 });
    }

    const simIccid = sims[0]?.iccid;
    if (!simIccid) {
      console.log('📱 No ICCID found in SIM data');
      return NextResponse.json({
        success: false,
        error: 'No ICCID found in SIM data. The order may still be processing.',
        orderDetails: orderDetails.data,
        canRetry: true
      }, { status: 400 });
    }

    console.log('📱 Found SIM ICCID:', simIccid);

    // Now get the actual eSIM details using the ICCID
    console.log('📱 Fetching eSIM details using ICCID...');
    const simResponse = await fetch(`${baseUrl}/v2/sims/${simIccid}`, {
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
        canRetry: true
      }, { status: 400 });
    }

    const simDetails = await simResponse.json();
    console.log('✅ Got eSIM details from Airalo:', simDetails);

    // Extract QR code data from SIM details
    const simData = simDetails.data;
    const qrCode = simData?.qr_code;
    const activationCode = simData?.activation_code;
    const iccid = simData?.iccid;
    const directAppleInstallationUrl = simData?.direct_apple_installation_url;

    console.log('📱 SIM status:', simData?.status);
    console.log('📱 Available SIM fields:', Object.keys(simData || {}));
    console.log('📱 Full SIM details:', JSON.stringify(simData, null, 2));

    // Check if we have QR code data
    const hasQRCode = qrCode || activationCode || directAppleInstallationUrl;
    console.log('📱 QR code check:', { 
      qrCode: !!qrCode, 
      activationCode: !!activationCode, 
      directAppleInstallationUrl: !!directAppleInstallationUrl,
      hasQRCode 
    });

    if (!hasQRCode) {
      console.log('📱 No QR code available yet, order may still be processing');
      
      // Check if this is a very recent order (less than 5 minutes old)
      const orderCreatedAt = new Date(orderDetails.data?.created_at);
      const now = new Date();
      const minutesSinceCreation = (now - orderCreatedAt) / (1000 * 60);
      
      console.log('📱 Order age:', minutesSinceCreation.toFixed(2), 'minutes');
      
      if (minutesSinceCreation < 5) {
        return NextResponse.json({
          success: false,
          error: 'QR code not available yet. The order was created recently and is still being processed. Please try again in a few minutes.',
          orderStatus: orderStatus,
          orderDetails: orderDetails.data,
          canRetry: true
        }, { status: 400 });
      } else {
        return NextResponse.json({
          success: false,
          error: 'QR code not available. The order has been processing for a while. Please contact support if this continues.',
          orderStatus: orderStatus,
          orderDetails: orderDetails.data,
          canRetry: true
        }, { status: 400 });
      }
    }

    // Use the available QR code data from SIM details
    const finalQrCode = qrCode || directAppleInstallationUrl;
    const finalActivationCode = activationCode;

    // Save complete API response data to Firebase for future access
    const completeQrData = {
      status: 'active',
      qrCode: finalQrCode,
      qrCodeUrl: simData?.qrcode_url,
      activationCode: finalActivationCode,
      iccid: iccid,
      lpa: simData?.lpa,
      matchingId: simData?.matching_id,
      orderStatus: simData?.status,
      airaloOrderDetails: orderDetails.data,
      airaloSimDetails: simData,
      directAppleInstallationUrl: directAppleInstallationUrl,
      smdpAddress: simData?.smdp_address,
      // Save all SIM data for complete record
      simDataComplete: {
        ...simData,
        // Ensure key fields are accessible
        qrcode: finalQrCode,
        qrcode_url: simData?.qrcode_url,
        direct_apple_installation_url: directAppleInstallationUrl,
        lpa: simData?.lpa,
        iccid: iccid,
        matching_id: simData?.matching_id,
        smdp_address: simData?.smdp_address,
        activation_code: finalActivationCode
      },
      // Update order result for compatibility
      orderResult: {
        qrCode: finalQrCode,
        qrCodeUrl: simData?.qrcode_url,
        activationCode: finalActivationCode,
        iccid: iccid,
        lpa: simData?.lpa,
        matchingId: simData?.matching_id,
        directAppleInstallationUrl: directAppleInstallationUrl,
        smdpAddress: simData?.smdp_address,
        status: 'active',
        success: true,
        provider: 'airalo',
        updatedAt: new Date().toISOString()
      },
      qrCodeRetrievedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await updateDoc(orderRef, completeQrData);

    console.log('✅ QR code retrieved and saved successfully with complete data');

    return NextResponse.json({
      success: true,
      qrCode: finalQrCode,
      qrCodeUrl: simData?.qrcode_url,
      activationCode: finalActivationCode,
      iccid: iccid,
      lpa: simData?.lpa,
      matchingId: simData?.matching_id,
      orderStatus: simData?.status,
      orderDetails: orderDetails.data,
      simDetails: simData,
      directAppleInstallationUrl: directAppleInstallationUrl,
      smdpAddress: simData?.smdp_address,
      message: 'QR code retrieved successfully',
      canRetry: false,
      // Allow multiple retrievals but indicate data is already saved
      canRetrieveMultipleTimes: true
    });

  } catch (error) {
    console.error('❌ Error getting QR code:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
