import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * Get Stripe secret key from environment variables (Vercel Stripe integration)
 */
function getStripeKey() {
  // Priority 1: Vercel Stripe Integration
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY;
  }
  
  // Priority 2: Mode-specific keys
  const isTest = process.env.STRIPE_MODE === 'test' || process.env.STRIPE_MODE === 'sandbox';
  if (isTest) {
    return process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_TEST_KEY;
  } else {
    return process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_KEY;
  }
}

/**
 * Stripe Payment Handler (READ-ONLY)
 * Stores payment events in Firestore - backend function processes eSIM creation
 */
export async function POST(request) {
  try {
    console.log('🔔 Stripe payment event received');

    // Get Stripe secret key
    const stripeKey = getStripeKey();
    if (!stripeKey) {
      console.error('❌ Stripe secret key not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    let event;
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('📦 Stripe webhook event:', {
      type: event.type,
      id: event.id
    });

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('✅ Checkout session completed:', {
        sessionId: session.id,
        customerEmail: session.customer_email,
        metadata: session.metadata
      });

      // Extract order information from metadata
      const planId = session.metadata?.plan_id;
      const orderId = session.metadata?.order_id;
      const customerEmail = session.customer_email || session.metadata?.email;
      const customerName = session.metadata?.name;

      if (!planId) {
        console.error('❌ No plan_id in session metadata');
        return NextResponse.json(
          { error: 'Missing plan_id in metadata' },
          { status: 400 }
        );
      }

      console.log('📦 Creating order via backend:', {
        planId,
        orderId,
        customerEmail
      });

      // Store order info in Firestore - backend will process it
      // This is safer than calling the function directly from webhook
      try {
        const { initializeApp } = await import('firebase-admin/app');
        const { getFirestore, FieldValue } = await import('firebase-admin/firestore');

        // Initialize Firebase Admin if not already initialized
        let app;
        try {
          const { getApps } = await import('firebase-admin/app');
          if (getApps().length === 0) {
            app = initializeApp();
          } else {
            app = getApps()[0];
          }
        } catch (e) {
          console.error('❌ Firebase Admin initialization error:', e);
          throw e;
        }

        const db = getFirestore();
        
        // Store order in pending_orders - backend function will process it
        const orderDoc = {
          sessionId: session.id,
          planId: planId,
          orderId: orderId || session.id,
          customerEmail: customerEmail,
          customerName: customerName,
          paymentStatus: 'completed',
          paymentMethod: 'stripe',
          amount: session.amount_total ? session.amount_total / 100 : null,
          currency: session.currency || 'usd',
          stripeSessionId: session.id,
          createdAt: FieldValue.serverTimestamp(),
          processed: false,
          source: 'webhook'
        };

        const pendingOrderRef = db.collection('pending_orders').doc(session.id);
        await pendingOrderRef.set(orderDoc);

        // Try to get user ID from customer email
        let userId = null;
        if (customerEmail) {
          const usersRef = db.collection('users');
          const userQuery = await usersRef.where('email', '==', customerEmail).limit(1).get();
          if (!userQuery.empty) {
            userId = userQuery.docs[0].id;
            await pendingOrderRef.update({ userId: userId });
          }
        }

        // Also store in stripe_payments collection for tracking
        const paymentRef = db.collection('stripe_payments').doc(session.id);
        await paymentRef.set({
          ...orderDoc,
          sessionData: {
            id: session.id,
            customer: session.customer,
            customer_email: session.customer_email,
            amount_total: session.amount_total,
            currency: session.currency,
            payment_status: session.payment_status
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Order queued for processing',
          sessionId: session.id
        });

      } catch (firebaseError) {
        console.error('❌ Error storing order in Firestore:', firebaseError);
        console.error('❌ Error stack:', firebaseError.stack);
        return NextResponse.json({
          success: false,
          error: firebaseError.message,
          details: firebaseError.stack
        }, { status: 500 });
      }
    }

    // Handle other event types
    console.log('ℹ️ Unhandled event type:', event.type);
    return NextResponse.json({
      success: true,
      message: 'Event received but not processed'
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

