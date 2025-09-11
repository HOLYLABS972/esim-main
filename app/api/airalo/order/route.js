import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      package_id, 
      quantity = "1", 
      type = "sim", 
      description, 
      brand_settings_name, 
      to_email, 
      sharing_option = ["link"], 
      copy_address 
    } = body;

    console.log('🛒 Airalo Order API called with data:', { 
      package_id, 
      quantity, 
      type, 
      description, 
      brand_settings_name, 
      to_email, 
      sharing_option, 
      copy_address 
    });

    if (!package_id) {
      console.log('❌ Missing required field: package_id');
      return NextResponse.json({
        success: false,
        error: 'Package ID is required'
      }, { status: 400 });
    }

    console.log('🛒 Creating Airalo order for package:', package_id);

    // Get Airalo credentials from Firestore
    const airaloConfigRef = doc(db, 'config', 'airalo');
    const airaloConfig = await getDoc(airaloConfigRef);
    
    if (!airaloConfig.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Airalo configuration not found. Please set up Airalo credentials in the admin panel.'
      }, { status: 400 });
    }
    
    const configData = airaloConfig.data();
    const clientId = configData.api_key;
    const clientSecret = process.env.AIRALO_CLIENT_SECRET_PRODUCTION;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Airalo credentials not found. Please check your configuration.'
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

    // Create form data for Airalo API (multipart/form-data)
    const formData = new FormData();
    formData.append('quantity', quantity);
    formData.append('package_id', package_id);
    formData.append('type', type);
    
    if (description) {
      formData.append('description', description);
    }
    
    if (brand_settings_name) {
      formData.append('brand_settings_name', brand_settings_name);
    }
    
    if (to_email) {
      formData.append('to_email', to_email);
      // Add sharing options
      if (Array.isArray(sharing_option)) {
        sharing_option.forEach(option => {
          formData.append('sharing_option[]', option);
        });
      } else {
        formData.append('sharing_option[]', sharing_option);
      }
      
      // Add copy addresses if provided
      if (copy_address) {
        if (Array.isArray(copy_address)) {
          copy_address.forEach(address => {
            formData.append('copy_address[]', address);
          });
        } else {
          formData.append('copy_address[]', copy_address);
        }
      }
    }

    console.log('📦 Sending order data to Airalo with form data');

    // Submit order to Airalo API
    const orderResponse = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
        // Note: Don't set Content-Type for FormData, let fetch set it with boundary
      },
      body: formData
    });

    console.log('📦 Airalo order response status:', orderResponse.status, orderResponse.statusText);

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.log('❌ Airalo order error response:', errorText);
      console.log('❌ Full error details:', {
        status: orderResponse.status,
        statusText: orderResponse.statusText,
        headers: Object.fromEntries(orderResponse.headers.entries()),
        body: errorText
      });
      
      throw new Error(`Order creation failed: ${orderResponse.statusText} - ${errorText}`);
    }

    const orderResult = await orderResponse.json();
    console.log('✅ Order created with Airalo:', orderResult);

    // Save order to Firestore
    const orderId = orderResult.data?.id ? orderResult.data.id.toString() : `airalo_${Date.now()}`;
    const orderRef = doc(db, 'orders', orderId);
    
    // Prepare order data, filtering out undefined values
    const orderData = {
      id: orderId,
      package_id: package_id,
      quantity: quantity,
      type: type,
      status: 'completed',
      provider: 'airalo',
      airaloOrderId: orderResult.data?.id,
      airaloOrderData: orderResult.data,
      // Store important response data
      esimData: {
        qrcode: orderResult.data?.sims?.[0]?.qrcode,
        qrcode_url: orderResult.data?.sims?.[0]?.qrcode_url,
        direct_apple_installation_url: orderResult.data?.sims?.[0]?.direct_apple_installation_url,
        iccid: orderResult.data?.sims?.[0]?.iccid,
        lpa: orderResult.data?.sims?.[0]?.lpa,
        matching_id: orderResult.data?.sims?.[0]?.matching_id,
        manual_installation: orderResult.data?.manual_installation,
        qrcode_installation: orderResult.data?.qrcode_installation,
        installation_guides: orderResult.data?.installation_guides
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Only add optional fields if they have values (avoid undefined in Firestore)
    if (description && description.trim()) orderData.description = description;
    if (brand_settings_name && brand_settings_name.trim()) orderData.brand_settings_name = brand_settings_name;
    if (to_email && to_email.trim()) orderData.to_email = to_email;
    if (sharing_option && Array.isArray(sharing_option) && sharing_option.length > 0) orderData.sharing_option = sharing_option;
    if (copy_address && Array.isArray(copy_address) && copy_address.length > 0) orderData.copy_address = copy_address;
    
    console.log('💾 Saving order to Firestore:', { orderId, orderDataKeys: Object.keys(orderData) });
    await setDoc(orderRef, orderData);
    console.log('✅ Order saved to Firestore successfully');

    return NextResponse.json({
      success: true,
      orderId: orderId,
      airaloOrderId: orderResult.data?.id,
      orderData: orderResult.data,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating Airalo order:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

