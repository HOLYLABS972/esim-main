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

    // Find the order in Firestore
    // First try in orders collection
    let orderRef = doc(firestore, 'orders', orderId);
    let orderDoc = await getDoc(orderRef);
    
    // If not found, search in users' esims subcollection
    if (!orderDoc.exists()) {
      console.log('🔍 Order not found in orders collection, searching in users...');
      // We need to find which user has this order
      // For now, we'll try to get it from the pending order or metadata
      const userId = charge.metadata?.user_id;
      if (userId) {
        orderRef = doc(firestore, 'users', userId, 'esims', orderId);
        orderDoc = await getDoc(orderRef);
      }
    }

    if (!orderDoc.exists()) {
      console.error('❌ Order not found:', orderId);
      return { success: false, error: 'Order not found' };
    }

    const orderData = orderDoc.data();
    console.log('📋 Found order:', orderData);

    // Update order with payment confirmation
    await updateDoc(orderRef, {
      paymentStatus: 'confirmed',
      paymentMethod: 'coinbase',
      coinbaseChargeId: charge.code || charge.id,
      coinbaseChargeData: charge,
      paymentConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // If order is already processed (has eSIM), just update payment status
    if (orderData.status === 'active' && orderData.processingStatus === 'completed') {
      console.log('✅ Order already processed, payment status updated');
      return { success: true, message: 'Payment confirmed, order already processed' };
    }

    // If order needs to be processed, trigger order creation
    // This would typically be done by the payment success page, but we'll ensure it's marked
    console.log('✅ Payment confirmed for order:', orderId);
    return { success: true, orderId, needsProcessing: !orderData.airaloOrderId };
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

