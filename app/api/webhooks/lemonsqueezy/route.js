import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

// Get Lemon Squeezy webhook secret
async function getLemonSqueezyWebhookSecret() {
  try {
    const firestore = await getFirestore();
    const { doc, getDoc } = await import('firebase-admin/firestore');
    
    const configRef = doc(firestore, 'config', 'lemonsqueezy');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const configData = configDoc.data();
      return configData.webhook_secret || configData.webhookSecret;
    }
    
    return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || null;
  } catch (error) {
    console.error('❌ Error getting Lemon Squeezy webhook secret:', error);
    return process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || null;
  }
}

// Verify Lemon Squeezy webhook signature
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

// Process order created event
async function processOrderCreated(order) {
  try {
    const firestore = await getFirestore();
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase-admin/firestore');
    
    console.log('✅ Processing Lemon Squeezy order created:', order.id);
    
    // Extract order ID from custom data
    const customData = order.attributes?.custom || {};
    const orderId = customData.order_id;
    
    if (!orderId) {
      console.error('❌ No order_id found in order custom data');
      return { success: false, error: 'No order_id in custom data' };
    }

    // Find or create the order in Firestore
    const globalOrderRef = doc(firestore, 'orders', orderId);
    const orderDoc = await getDoc(globalOrderRef);
    
    // Update order with Lemon Squeezy payment info
    await setDoc(globalOrderRef, {
      lemonSqueezyOrderId: order.id,
      lemonSqueezyOrderData: order,
      paymentStatus: 'pending',
      paymentMethod: 'lemonsqueezy',
      paymentCreatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ Order updated with Lemon Squeezy payment info:', orderId);
    return { success: true, orderId };
  } catch (error) {
    console.error('❌ Error processing order created:', error);
    return { success: false, error: error.message };
  }
}

// Process order paid event
async function processOrderPaid(order) {
  try {
    const firestore = await getFirestore();
    const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase-admin/firestore');
    
    console.log('✅ Processing Lemon Squeezy order paid:', order.id);
    
    // Extract order ID from custom data
    const customData = order.attributes?.custom || {};
    const orderId = customData.order_id;
    
    if (!orderId) {
      console.error('❌ No order_id found in order custom data');
      return { success: false, error: 'No order_id in custom data' };
    }

    // Find the order in Firestore
    const globalOrderRef = doc(firestore, 'orders', orderId);
    const orderDoc = await getDoc(globalOrderRef);
    
    if (!orderDoc.exists()) {
      console.error('❌ Order not found:', orderId);
      return { success: false, error: 'Order not found' };
    }

    const orderData = orderDoc.data();
    console.log('📋 Found order:', orderId);

    // Update order with payment confirmation
    await updateDoc(globalOrderRef, {
      paymentStatus: 'confirmed',
      paymentMethod: 'lemonsqueezy',
      lemonSqueezyOrderId: order.id,
      lemonSqueezyOrderData: order,
      paymentConfirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // If order is already processed (has eSIM), just update payment status
    if (orderData.status === 'active' && orderData.processingStatus === 'completed') {
      console.log('✅ Order already processed, payment status updated');
      return { success: true, message: 'Payment confirmed, order already processed' };
    }

    console.log('✅ Payment confirmed for order:', orderId);
    return { success: true, orderId, needsProcessing: !orderData.airaloOrderId };
  } catch (error) {
    console.error('❌ Error processing order paid:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  try {
    console.log('🔔 Lemon Squeezy webhook received');

    // Get raw body for signature verification
    const rawBody = await request.text();
    // Lemon Squeezy sends signature in X-Signature header (case-insensitive)
    const signature = request.headers.get('x-signature') || request.headers.get('X-Signature') || '';

    // Get webhook secret
    const webhookSecret = await getLemonSqueezyWebhookSecret();

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
    console.log('📦 Lemon Squeezy webhook event:', {
      meta: event.meta,
      eventName: event.meta?.event_name
    });

    // Handle different event types
    const eventName = event.meta?.event_name;
    const order = event.data;

    switch (eventName) {
      case 'order_created':
        console.log('📦 Order created');
        const createdResult = await processOrderCreated(order);
        return NextResponse.json({ 
          success: true, 
          message: 'Order created',
          result: createdResult
        });

      case 'subscription_payment_success':
        console.log('✅ Payment confirmed');
        const paidResult = await processOrderPaid(order);
        return NextResponse.json({ 
          success: true, 
          message: 'Payment successful',
          result: paidResult
        });

      case 'order_refunded':
        console.log('💰 Order refunded');
        // Handle refund if needed
        return NextResponse.json({ 
          success: true, 
          message: 'Order refunded' 
        });

      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_cancelled':
        console.log('ℹ️ Subscription event:', eventName);
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription event received' 
        });

      default:
        console.log('ℹ️ Unhandled event type:', eventName);
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

// Lemon Squeezy webhooks should only accept POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
