import { NextResponse } from 'next/server';
import { getAiraloAccessToken, AIRALO_BASE_URL } from '../../../lib/airaloAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    console.log('📱 Getting QR code for order:', orderId);

    // Get order from Supabase
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      console.log('❌ Order not found:', orderId);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Return cached QR code if available
    if (orderData.qr_code && orderData.qr_code_retrieved_at) {
      console.log('✅ Returning cached QR code');
      return NextResponse.json({
        success: true,
        qrCode: orderData.qr_code,
        qrCodeUrl: orderData.qr_code_url,
        activationCode: orderData.activation_code,
        iccid: orderData.iccid,
        lpa: orderData.lpa,
        matchingId: orderData.matching_id,
        directAppleInstallationUrl: orderData.direct_apple_installation_url,
        fromCache: true
      });
    }

    const airaloOrderId = orderData.airalo_order_id || orderData.airaloOrderId;
    if (!airaloOrderId) {
      return NextResponse.json({ success: false, error: 'Airalo order ID not found' }, { status: 400 });
    }

    const accessToken = await getAiraloAccessToken();

    // Get order details from Airalo
    const orderResponse = await fetch(`${AIRALO_BASE_URL}/v2/orders/${airaloOrderId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`Failed to get order details: ${orderResponse.statusText} - ${errorText}`);
    }

    const orderDetails = await orderResponse.json();
    const sims = orderDetails.data?.sims;
    if (!sims?.length) {
      return NextResponse.json({ success: false, error: 'No SIMs found in order', canRetry: true }, { status: 400 });
    }

    const simIccid = sims[0]?.iccid;
    if (!simIccid) {
      return NextResponse.json({ success: false, error: 'No ICCID found', canRetry: true }, { status: 400 });
    }

    // Get SIM details
    const simResponse = await fetch(`${AIRALO_BASE_URL}/v2/sims/${simIccid}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });

    if (!simResponse.ok) {
      const errorText = await simResponse.text();
      return NextResponse.json({ success: false, error: `Failed to get eSIM details: ${errorText}`, canRetry: true }, { status: 400 });
    }

    const simDetails = await simResponse.json();
    const simData = simDetails.data;
    const qrCode = simData?.qr_code || simData?.direct_apple_installation_url;
    const activationCode = simData?.activation_code;

    if (!qrCode && !activationCode) {
      return NextResponse.json({ success: false, error: 'QR code not available yet', canRetry: true }, { status: 400 });
    }

    // Save to Supabase
    await supabaseAdmin.from('orders').update({
      status: 'active',
      qr_code: qrCode,
      qr_code_url: simData?.qrcode_url,
      activation_code: activationCode,
      iccid: simData?.iccid,
      lpa: simData?.lpa,
      matching_id: simData?.matching_id,
      direct_apple_installation_url: simData?.direct_apple_installation_url,
      qr_code_retrieved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    return NextResponse.json({
      success: true,
      qrCode,
      qrCodeUrl: simData?.qrcode_url,
      activationCode,
      iccid: simData?.iccid,
      lpa: simData?.lpa,
      matchingId: simData?.matching_id,
      orderStatus: simData?.status,
      orderDetails: orderDetails.data,
      simDetails: simData,
      directAppleInstallationUrl: simData?.direct_apple_installation_url,
      message: 'QR code retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting QR code:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
