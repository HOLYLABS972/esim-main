import { NextResponse } from 'next/server';

// Lazy load Firebase Admin to avoid initialization issues
let db = null;

async function getFirestore() {
  if (db) return db;

  try {
    const admin = await import('firebase-admin/app');
    const firestore = await import('firebase-admin/firestore');

    // Initialize Firebase Admin if not already initialized
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

    db = firestore.getFirestore();
    return db;
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw error;
  }
}

// Get Lemon Squeezy config from Firestore
async function getLemonSqueezyConfig() {
  try {
    const firestore = await getFirestore();
    const { doc, getDoc } = await import('firebase-admin/firestore');
    
    const configRef = doc(firestore, 'config', 'lemonsqueezy');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const configData = configDoc.data();
      return {
        apiKey: configData.api_key || configData.apiKey,
        storeId: configData.store_id || configData.storeId,
        webhookSecret: configData.webhook_secret || configData.webhookSecret
      };
    }
    
    // Fallback to environment variables
    return {
      apiKey: process.env.LEMON_SQUEEZY_API_KEY,
      storeId: process.env.LEMON_SQUEEZY_STORE_ID,
      webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
    };
  } catch (error) {
    console.error('❌ Error getting Lemon Squeezy config:', error);
    return {
      apiKey: process.env.LEMON_SQUEEZY_API_KEY,
      storeId: process.env.LEMON_SQUEEZY_STORE_ID,
      webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
    };
  }
}

export async function POST(request) {
  try {
    console.log('🔄 Creating Lemon Squeezy checkout...');
    
    const body = await request.json();
    const { orderData, redirectUrl } = body;
    
    if (!orderData) {
      return NextResponse.json(
        { error: 'Order data is required' },
        { status: 400 }
      );
    }

    // Get Lemon Squeezy configuration
    const config = await getLemonSqueezyConfig();
    
    if (!config.apiKey || !config.storeId) {
      return NextResponse.json(
        { error: 'Lemon Squeezy API key or Store ID not configured' },
        { status: 500 }
      );
    }

    // Build redirect URL with all necessary parameters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = redirectUrl || `${baseUrl}/payment-success?payment_method=lemonsqueezy&order_id=${orderData.orderId}&email=${encodeURIComponent(orderData.customerEmail)}&total=${orderData.amount}&currency=${orderData.currency || 'usd'}&plan=${encodeURIComponent(orderData.planId)}&name=${encodeURIComponent(orderData.planName || 'eSIM Plan')}`;

    // Create checkout session via Lemon Squeezy API
    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          custom_price: Math.round(parseFloat(orderData.amount) * 100), // Convert to cents
          product_options: {
            name: orderData.planName || 'eSIM Plan',
            description: `eSIM data plan purchase - ${orderData.planName || 'Plan'}`,
            redirect_url: successUrl,
            receipt_button_text: 'View eSIM',
            receipt_link_url: successUrl,
            receipt_thank_you_note: 'Thank you for your purchase! Your eSIM will be activated shortly.'
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: false
          },
          checkout_data: {
            email: orderData.customerEmail,
            custom: {
              order_id: orderData.orderId,
              plan_id: orderData.planId,
              plan_name: orderData.planName,
              user_id: orderData.userId || null
            }
          },
          expires_at: null,
          preview: false,
          test_mode: false
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: config.storeId
            }
          }
        }
      }
    };

    console.log('📤 Creating Lemon Squeezy checkout:', {
      storeId: config.storeId,
      amount: checkoutData.data.attributes.custom_price,
      orderId: orderData.orderId
    });

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      body: JSON.stringify(checkoutData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lemon Squeezy API error:', errorText);
      return NextResponse.json(
        { error: `Lemon Squeezy API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Lemon Squeezy checkout created:', result.data.id);

    return NextResponse.json({
      success: true,
      checkout: result.data
    });

  } catch (error) {
    console.error('❌ Error creating Lemon Squeezy checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
