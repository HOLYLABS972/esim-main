import { NextResponse } from 'next/server';

// Lazy load Firebase Admin
let db = null;

async function getFirestore() {
  if (db) return db;

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
    console.log('🔄 Creating Lemon Squeezy webhook via API...');
    
    const body = await request.json();
    const { webhookUrl, events, webhookSecret } = body;
    
    // Get Lemon Squeezy configuration
    const config = await getLemonSqueezyConfig();
    
    if (!config.apiKey || !config.storeId) {
      return NextResponse.json(
        { error: 'Lemon Squeezy API key or Store ID not configured' },
        { status: 500 }
      );
    }

    // Use provided values or fallback to config
    const finalWebhookUrl = webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/api/webhooks/lemonsqueezy`;
    const finalWebhookSecret = webhookSecret || config.webhookSecret || 'e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c';
    const finalEvents = events || [
      'order_created',
      'order_paid',
      'subscription_created',
      'subscription_updated',
      'subscription_cancelled'
    ];

    // Create webhook via Lemon Squeezy API
    const webhookData = {
      data: {
        type: 'webhooks',
        attributes: {
          url: finalWebhookUrl,
          events: finalEvents,
          secret: finalWebhookSecret
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

    console.log('📤 Creating webhook:', {
      storeId: config.storeId,
      url: finalWebhookUrl,
      events: finalEvents
    });

    const response = await fetch('https://api.lemonsqueezy.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
      body: JSON.stringify(webhookData)
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
    console.log('✅ Lemon Squeezy webhook created:', result.data.id);

    return NextResponse.json({
      success: true,
      webhook: result.data,
      message: 'Webhook created successfully. Make sure the same webhook_secret is in your Firestore config.'
    });

  } catch (error) {
    console.error('❌ Error creating Lemon Squeezy webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
