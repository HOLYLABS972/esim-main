import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Set timezone to match Coinbase Commerce server timezone (PST/PDT: -08:00)
// This is important for webhook signature verification and timestamp validation
// Coinbase compares server timestamps, so they must match
if (typeof process !== 'undefined' && process.env.TZ === undefined) {
  // Default to PST/PDT timezone for Coinbase compatibility
  // You can override this by setting TZ environment variable
  process.env.TZ = 'America/Los_Angeles'; // PST/PDT (-08:00/-07:00)
}

// Alternative: Set to fixed UTC-8 offset
// process.env.TZ = 'PST8PDT';

// Lazy load Firebase Admin to avoid initialization issues
let db = null;

async function getFirestore() {
  if (db) return db;

  try {
    const admin = await import('firebase-admin/app');
    const firestore = await import('firebase-admin/firestore');

    // Initialize Firebase Admin if not already initialized
    if (!admin.getApps().length) {
      // Use service account from environment variables or default credentials
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.cert(serviceAccount),
        });
      } else {
        // Use default credentials (for Firebase hosting/Cloud Run/Vercel)
        // These will be automatically detected from environment
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

// Get Coinbase webhook secret from config
async function getCoinbaseWebhookSecret() {
  try {
    const firestore = await getFirestore();
    const { doc, getDoc } = await import('firebase-admin/firestore');
    
    // First try Firestore
    const configRef = doc(firestore, 'config', 'coinbase');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const configData = configDoc.data();
      return configData.webhook_secret || configData.webhookSecret;
    }
    
    // Fallback to environment variable
    return process.env.COINBASE_WEBHOOK_SECRET || null;
  } catch (error) {
    console.error('❌ Error getting Coinbase webhook secret:', error);
    return process.env.COINBASE_WEBHOOK_SECRET || null;
  }
}

// Verify Coinbase webhook signature
function verifyWebhookSignature(body, signature, secret) {
  if (!secret) {
    console.warn('⚠️ Webhook secret not configured, skipping signature verification');
    return true; // Allow in development, but should be false in production
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    const hash = hmac.update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

// Process confirmed charge
async function processConfirmedCharge(charge) {
  try {
    const firestore = await getFirestore();
    const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase-admin/firestore');
    
    console.log('✅ Processing confirmed Coinbase charge:', charge.code || charge.id);
    
    // Extract order ID from metadata
    const orderId = charge.metadata?.order_id;
    if (!orderId) {
      console.error('❌ No order_id found in charge metadata');
      return { success: false, error: 'No order_id in metadata' };
    }

    // Find or create the order in Firestore
    // First try in orders collection
    let orderRef = doc(firestore, 'orders', orderId);
    let orderDoc = await getDoc(orderRef);
    
    // If not found, search in users' esims subcollection
    if (!orderDoc.exists()) {
      console.log('🔍 Order not found in orders collection, searching in users...');
      const userId = charge.metadata?.user_id;
      if (userId) {
        orderRef = doc(firestore, 'users', userId, 'esims', orderId);
        orderDoc = await getDoc(orderRef);
      }
    }

    // If order doesn't exist, create it from charge metadata (like Stripe webhook does)
    if (!orderDoc.exists()) {
      console.log('📝 Order not found, creating from webhook metadata...');
      const { setDoc, FieldValue } = await import('firebase-admin/firestore');
      
      const planId = charge.metadata?.plan_id;
      const customerEmail = charge.metadata?.customer_email || null;
      const userId = charge.metadata?.user_id || null;
      const amount = charge.pricing?.local?.amount || null;
      const currency = charge.pricing?.local?.currency || 'USD';
      
      if (!customerEmail) {
        console.error('❌ No customer_email in charge metadata');
        return { success: false, error: 'No customer_email in metadata' };
      }
      
      if (!planId) {
        console.error('❌ No plan_id in charge metadata');
        return { success: false, error: 'No plan_id in metadata' };
      }
      
      // Create order document
      const newOrderData = {
        id: orderId,
        orderId: orderId,
        planId: planId,
        package_id: planId,
        customerEmail: customerEmail,
        userEmail: customerEmail,
        userId: userId,
        amount: amount ? parseFloat(amount) : null,
        currency: currency.toLowerCase(),
        paymentStatus: 'confirmed',
        paymentMethod: 'coinbase',
        coinbaseChargeId: charge.code || charge.id,
        coinbaseChargeData: charge,
        status: 'pending',
        provider: 'airalo',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        source: 'webhook'
      };
      
      // Save to orders collection
      orderRef = doc(firestore, 'orders', orderId);
      await setDoc(orderRef, newOrderData);
      
      // Also save to user's esims subcollection if userId exists
      if (userId) {
        try {
          const userEsimRef = doc(firestore, 'users', userId, 'esims', orderId);
          await setDoc(userEsimRef, {
            orderId: orderId,
            planId: planId,
            status: 'pending',
            customerEmail: customerEmail,
            paymentStatus: 'confirmed',
            paymentMethod: 'coinbase',
            coinbaseChargeId: charge.code || charge.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });
        } catch (userSaveError) {
          console.error('⚠️ Could not save to user esims collection:', userSaveError);
        }
      }
      
      orderDoc = await getDoc(orderRef);
      console.log('✅ Order created from webhook metadata');
    }

    if (!orderDoc.exists()) {
      console.error('❌ Failed to create/find order:', orderId);
      return { success: false, error: 'Order not found and could not be created' };
    }

    const orderData = orderDoc.data();
    console.log('📋 Found/created order:', orderData);

    // Update order with payment confirmation (only if not just created)
    if (orderData.paymentStatus !== 'confirmed') {
      await updateDoc(orderRef, {
        paymentStatus: 'confirmed',
        paymentMethod: 'coinbase',
        coinbaseChargeId: charge.code || charge.id,
        coinbaseChargeData: charge,
        paymentConfirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // If order is already processed (has eSIM), just update payment status
    if (orderData.status === 'active' && orderData.processingStatus === 'completed' && orderData.airaloOrderId) {
      console.log('✅ Order already processed, payment status updated');
      return { success: true, message: 'Payment confirmed, order already processed' };
    }

    // If order doesn't have Airalo order ID, create it now (like Stripe webhook does)
    if (!orderData.airaloOrderId) {
      console.log('🚀 Creating eSIM order via Airalo API...');
      
      try {
        // Get Airalo credentials from Firestore config
        const configRef = doc(firestore, 'config', 'airalo');
        const configDoc = await getDoc(configRef);
        
        if (!configDoc.exists()) {
          throw new Error('Airalo config not found in Firestore');
        }
        
        const configData = configDoc.data();
        const airaloClientId = configData.api_key || configData.client_id;
        const airaloClientSecret = configData.client_secret;
        const baseUrl = configData.base_url || 'https://partners-api.airalo.com';
        
        if (!airaloClientId || !airaloClientSecret) {
          throw new Error('Airalo credentials not configured');
        }

        console.log('🔐 Authenticating with Airalo...');
        
        // Step 1: Get access token
        const tokenResponse = await fetch(`${baseUrl}/v2/token`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: airaloClientId,
            client_secret: airaloClientSecret,
            grant_type: 'client_credentials'
          })
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(`Airalo auth failed: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.data?.access_token;
        
        if (!accessToken) {
          throw new Error('No access token from Airalo');
        }

        console.log('✅ Airalo authenticated, creating order...');
        
        // Step 2: Create order with Airalo
        const planId = orderData.planId || orderData.package_id;
        if (!planId) {
          throw new Error('No planId found in order data');
        }
        
        const customerEmail = orderData.customerEmail || orderData.userEmail || orderData.email;
        
        const orderDataPayload = {
          package_id: planId,
          quantity: "1",
          type: "sim",
          to_email: customerEmail,
          description: `eSIM order for ${customerEmail}`,
          sharing_option: ["link"]
        };

        console.log('📞 Making Airalo API call:', JSON.stringify(orderDataPayload, null, 2));
        
        const orderResponse = await fetch(`${baseUrl}/v2/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderDataPayload)
        });

        console.log('📡 Airalo API response status:', orderResponse.status);

        if (!orderResponse.ok) {
          const errorText = await orderResponse.text();
          console.error('❌ Airalo order creation failed:', errorText);
          throw new Error(`Airalo order failed: ${orderResponse.status} - ${errorText}`);
        }

        const orderResult = await orderResponse.json();
        console.log('✅ Airalo order created:', JSON.stringify(orderResult, null, 2));

        // Step 3: Update order with Airalo data
        const airaloData = orderResult.data || {};
        const simsData = airaloData.sims || [];
        
        const updateData = {
          airaloOrderId: airaloData.id,
          airaloOrderData: airaloData,
          status: simsData.length > 0 ? 'completed' : 'processing',
          provider: 'airalo',
          updatedAt: serverTimestamp(),
          ...(simsData.length > 0 && {
            esimData: {
              qrcode: simsData[0].qrcode,
              qrcode_url: simsData[0].qrcode_url,
              direct_apple_installation_url: simsData[0].direct_apple_installation_url,
              iccid: simsData[0].iccid,
              lpa: simsData[0].lpa,
              matching_id: simsData[0].matching_id
            }
          })
        };

        await updateDoc(orderRef, updateData);
        
        // Also update user's esims subcollection if exists
        const userId = charge.metadata?.user_id || orderData.userId;
        if (userId) {
          try {
            const userEsimRef = doc(firestore, 'users', userId, 'esims', orderId);
            const userEsimDoc = await getDoc(userEsimRef);
            if (userEsimDoc.exists()) {
              await updateDoc(userEsimRef, {
                airaloOrderId: airaloData.id,
                status: simsData.length > 0 ? 'active' : 'processing',
                esimData: simsData.length > 0 ? {
                  qrcode: simsData[0].qrcode,
                  qrcode_url: simsData[0].qrcode_url,
                  direct_apple_installation_url: simsData[0].direct_apple_installation_url,
                  iccid: simsData[0].iccid,
                  lpa: simsData[0].lpa,
                  matching_id: simsData[0].matching_id
                } : null,
                updatedAt: serverTimestamp()
              });
            }
          } catch (userUpdateError) {
            console.error('⚠️ Could not update user esims collection:', userUpdateError);
          }
        }

        console.log('✅ Order created and updated successfully!');
        return { success: true, orderId, airaloOrderId: airaloData.id };
      } catch (apiError) {
        console.error('❌ Error creating order via Airalo API:', apiError);
        // Don't fail webhook - payment is confirmed, order can be created later
        return { success: true, orderId, error: apiError.message, needsProcessing: true };
      }
    }

    console.log('✅ Payment confirmed for order:', orderId);
    return { success: true, orderId };
  } catch (error) {
    console.error('❌ Error processing confirmed charge:', error);
    return { success: false, error: error.message };
  }
}

// Process failed charge
async function processFailedCharge(charge) {
  try {
    const firestore = await getFirestore();
    const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase-admin/firestore');
    
    console.log('❌ Processing failed Coinbase charge:', charge.code || charge.id);
    
    const orderId = charge.metadata?.order_id;
    if (!orderId) {
      return { success: false, error: 'No order_id in metadata' };
    }

    // Find and update order
    let orderRef = doc(firestore, 'orders', orderId);
    let orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      const userId = charge.metadata?.user_id;
      if (userId) {
        orderRef = doc(firestore, 'users', userId, 'esims', orderId);
        orderDoc = await getDoc(orderRef);
      }
    }

    if (orderDoc.exists()) {
      await updateDoc(orderRef, {
        paymentStatus: 'failed',
        paymentMethod: 'coinbase',
        coinbaseChargeId: charge.code || charge.id,
        paymentFailedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error processing failed charge:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  try {
    console.log('🔔 Coinbase webhook received');

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-cc-webhook-signature') || '';

    // Get webhook secret
    const webhookSecret = await getCoinbaseWebhookSecret();

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook data
    const event = JSON.parse(rawBody);
    console.log('📦 Coinbase webhook event:', {
      type: event.type,
      chargeId: event.data?.code || event.data?.id
    });

    // Handle different event types
    switch (event.type) {
      case 'charge:confirmed':
      case 'charge:resolved':
        console.log('✅ Payment confirmed/resolved');
        const confirmResult = await processConfirmedCharge(event.data);
        return NextResponse.json({ 
          success: true, 
          message: 'Charge confirmed',
          result: confirmResult
        });

      case 'charge:failed':
      case 'charge:delayed':
        console.log('❌ Payment failed/delayed');
        const failResult = await processFailedCharge(event.data);
        return NextResponse.json({ 
          success: true, 
          message: 'Charge failed',
          result: failResult
        });

      case 'charge:created':
      case 'charge:pending':
        console.log('⏳ Payment pending');
        return NextResponse.json({ 
          success: true, 
          message: 'Charge pending' 
        });

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
        return NextResponse.json({ 
          success: true, 
          message: 'Event received but not processed' 
        });
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Webhook processing failed' 
      },
      { status: 500 }
    );
  }
}

// Coinbase webhooks should only accept POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

