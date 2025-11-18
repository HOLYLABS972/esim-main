import { NextResponse } from 'next/server';

const COINBASE_COMMERCE_API_URL = 'https://api.commerce.coinbase.com';

// Get Coinbase API key (for creating charges)
// Coinbase Commerce uses the API Key (client API key) for charge creation, not the private key
async function getCoinbaseApiKey() {
  try {
    // Try API key first (this is what Coinbase Commerce uses for charge creation)
    const envApiKey = process.env.COINBASE_API_KEY || process.env.NEXT_PUBLIC_COINBASE_API_KEY;
    const envPrivateKey = process.env.COINBASE_PRIVATE_KEY;
    
    console.log('🔍 Checking for Coinbase credentials:', {
      hasApiKey: !!envApiKey,
      hasPrivateKey: !!envPrivateKey,
      apiKeyLength: envApiKey?.length || 0,
      privateKeyLength: envPrivateKey?.length || 0
    });
    
    // Coinbase Commerce uses API Key for charge creation
    // Try API key first, then private key as fallback
    if (envApiKey) {
      console.log('✅ Using API key from environment variable');
      return envApiKey.trim();
    }
    
    if (envPrivateKey) {
      console.log('⚠️ Using private key as fallback (API key preferred)');
      return envPrivateKey.trim();
    }
    
    // Try Firestore config
    try {
      const admin = await import('firebase-admin/app');
      const firestore = await import('firebase-admin/firestore');
      
      if (!admin.getApps().length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : undefined;

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.cert(serviceAccount),
          });
        } else {
          admin.initializeApp();
        }
      }
      
      const db = firestore.getFirestore();
      const { doc, getDoc } = await import('firebase-admin/firestore');
      
      const configRef = doc(db, 'config', 'coinbase');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        // Try API key first, then private key
        const apiKey = configData.api_key || configData.apiKey;
        const privateKey = configData.private_key || configData.privateKey;
        
        if (apiKey) {
          console.log('✅ Using API key from Firestore');
          return apiKey.trim();
        }
        
        if (privateKey) {
          console.log('⚠️ Using private key from Firestore as fallback');
          return privateKey.trim();
        }
      }
    } catch (firestoreError) {
      console.warn('⚠️ Could not load from Firestore:', firestoreError.message);
    }
    
    console.error('❌ No API key or private key found');
    return null;
  } catch (error) {
    console.error('❌ Error getting Coinbase API key:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    console.log('🔔 Coinbase create charge API called');
    
    const body = await request.json();
    const { orderData } = body;
    
    if (!orderData) {
      return NextResponse.json(
        { error: 'Missing orderData' },
        { status: 400 }
      );
    }
    
    // Get API key (Coinbase Commerce uses API Key for charge creation)
    const apiKey = await getCoinbaseApiKey();
    
    if (!apiKey) {
      console.error('❌ Coinbase API key not configured');
      console.error('📋 Please add to .env.local: COINBASE_API_KEY=your-api-key');
      return NextResponse.json(
        { 
          error: 'Coinbase API key not configured',
          details: 'Please set COINBASE_API_KEY (or COINBASE_PRIVATE_KEY as fallback) in your .env.local file'
        },
        { status: 500 }
      );
    }
    
    console.log('🔑 API key loaded:', {
      length: apiKey.length,
      prefix: apiKey.substring(0, 10),
      suffix: apiKey.substring(apiKey.length - 10)
    });
    
    // Build redirect URL
    const baseRedirectUrl = body.redirectUrl || `${request.headers.get('origin') || 'https://store.roamjet.net'}/payment-success`;
    const redirectParams = new URLSearchParams({
      order_id: orderData.orderId,
      email: orderData.customerEmail,
      total: orderData.amount.toString(),
      currency: orderData.currency || 'USD',
      payment_method: 'coinbase'
    });
    
    // Create charge data
    const chargeData = {
      name: orderData.planName || 'eSIM Plan',
      description: `eSIM data plan purchase - ${orderData.planName}`,
      local_price: {
        amount: parseFloat(orderData.amount || 0).toFixed(2),
        currency: orderData.currency || 'USD'
      },
      pricing_type: 'fixed_price',
      metadata: {
        order_id: orderData.orderId,
        plan_id: orderData.planId,
        customer_email: orderData.customerEmail,
        source: 'esim_shop',
        user_id: orderData.userId || null
      },
      redirect_url: `${baseRedirectUrl}?${redirectParams.toString()}`,
      cancel_url: `${request.headers.get('origin') || 'https://store.roamjet.net'}/checkout`
    };
    
    console.log('🔍 Creating Coinbase charge via server:', {
      name: chargeData.name,
      amount: chargeData.local_price.amount,
      currency: chargeData.local_price.currency,
      orderId: orderData.orderId
    });
    
    // Create charge using API key
    const response = await fetch(`${COINBASE_COMMERCE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey.trim(),
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(chargeData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }
      
      console.error('❌ Coinbase API error:', errorText);
      console.error('🔍 API Key used:', {
        length: apiKey.length,
        prefix: apiKey.substring(0, 15),
        suffix: apiKey.substring(apiKey.length - 10)
      });
      
      // Provide helpful error message
      if (response.status === 401 && errorData?.error?.code === 'no_such_api_key') {
        const helpfulMessage = `
❌ Coinbase API Key Authentication Failed

The API key is being sent but Coinbase doesn't recognize it. 

📋 IMPORTANT: You need a Secret API Key from Coinbase Commerce, not just the client key.

To get the correct API key:
1. Go to https://commerce.coinbase.com/dashboard/settings
2. Navigate to "API Keys" section  
3. Click "Create API Key" or "New API Key"
4. Copy the Secret API Key (this is different from the client key)
5. The Secret API Key should be 64+ characters long

OR if using Coinbase CDP:
1. Go to https://portal.cdp.coinbase.com
2. Navigate to your project
3. Go to API Keys > Secret API Keys
4. Create a new Secret API Key for Coinbase Commerce
5. Use that key (not the client key)

Current key length: ${apiKey.length} characters
If it's 32 characters, that's likely a client key or shared secret, not the API key for charge creation.
        `.trim();
        
        console.error(helpfulMessage);
      }
      
      return NextResponse.json(
        { 
          error: `Coinbase API error: ${response.status} - ${errorText}`,
          details: errorData?.error?.message || errorText
        },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('✅ Coinbase charge created:', result.data?.code || result.data?.id);
    
    return NextResponse.json({
      success: true,
      charge: result.data
    });
    
  } catch (error) {
    console.error('❌ Error creating Coinbase charge:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create charge' },
      { status: 500 }
    );
  }
}

