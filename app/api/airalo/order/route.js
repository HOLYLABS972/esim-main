import { NextResponse } from 'next/server';
import { getAiraloAccessToken, AIRALO_BASE_URL } from '../../../lib/airaloAuth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { package_id, quantity = "1", type = "sim", description, brand_settings_name, to_email, sharing_option = ["link"], copy_address } = body;

    if (!package_id) {
      return NextResponse.json({ success: false, error: 'Package ID is required' }, { status: 400 });
    }

    console.log('🛒 Creating Airalo order for package:', package_id);

    const accessToken = await getAiraloAccessToken();
    console.log('✅ Authenticated with Airalo API');

    const formData = new FormData();
    formData.append('quantity', quantity);
    formData.append('package_id', package_id);
    formData.append('type', type);
    if (description) formData.append('description', description);
    if (brand_settings_name) formData.append('brand_settings_name', brand_settings_name);
    if (to_email) {
      formData.append('to_email', to_email);
      (Array.isArray(sharing_option) ? sharing_option : [sharing_option]).forEach(opt => formData.append('sharing_option[]', opt));
      if (copy_address) {
        (Array.isArray(copy_address) ? copy_address : [copy_address]).forEach(addr => formData.append('copy_address[]', addr));
      }
    }

    const orderResponse = await fetch(`${AIRALO_BASE_URL}/v2/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      body: formData
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`Order creation failed: ${orderResponse.statusText} - ${errorText}`);
    }

    const orderResult = await orderResponse.json();
    console.log('✅ Order created with Airalo:', orderResult);

    return NextResponse.json({
      success: true,
      orderId: orderResult.data?.id?.toString() || `airalo_${Date.now()}`,
      airaloOrderId: orderResult.data?.id,
      orderData: orderResult.data,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating Airalo order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
