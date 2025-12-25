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
 * Stripe Webhook Handler
 * Processes checkout.session.completed events and creates eSIM orders via backend
 */
export async function POST(request) {
  try {
    console.log('🔔 Stripe webhook received');

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
        
        // Create order document that will trigger backend processing
        // The backend can listen to this collection or we can call it directly
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

        // Store in pending_orders collection for backend to process
        const pendingOrderRef = db.collection('pending_orders').doc(session.id);
        await pendingOrderRef.set(orderDoc);

        console.log('✅ Order stored in Firestore');

        // Try to get user ID from customer email to call backend function
        // We'll need to find the user by email or use a system account
        // For now, store the order and let a scheduled function process it
        // OR the frontend can trigger it when user visits success page
        
        // Store user lookup info if available
        let userId = null;
        if (customerEmail) {
          // Try to find user by email
          const usersRef = db.collection('users');
          const userQuery = await usersRef.where('email', '==', customerEmail).limit(1).get();
          
          if (!userQuery.empty) {
            userId = userQuery.docs[0].id;
            await pendingOrderRef.update({ userId: userId });
            console.log('✅ Found user ID:', userId);
          }
        }

        // DIRECTLY CALL AIRALO API (Firestore trigger has permission issues, so we do it here)
        try {
          console.log('🚀 Calling Airalo API directly from webhook...');
          
          // Get Airalo credentials from Firestore config
          const configRef = db.collection('config').doc('airalo');
          const configDoc = await configRef.get();
          
          if (!configDoc.exists) {
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
          const orderData = {
            package_id: planId,
            quantity: "1",
            type: "sim",
            to_email: customerEmail,
            description: `eSIM order for ${customerEmail}`,
            sharing_option: ["link"]
          };

          console.log('📞 Making Airalo API call:', JSON.stringify(orderData, null, 2));
          
          const orderResponse = await fetch(`${baseUrl}/v2/orders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
          });

          console.log('📡 Airalo API response status:', orderResponse.status);

          if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('❌ Airalo order creation failed:', errorText);
            throw new Error(`Airalo order failed: ${orderResponse.status} - ${errorText}`);
          }

          const orderResult = await orderResponse.json();
          console.log('✅ Airalo order created:', JSON.stringify(orderResult, null, 2));

          // Step 3: Save order to Firestore
          const finalOrderId = orderId || session.id;
          const orderRef = db.collection('orders').doc(finalOrderId);
          
          const airaloData = orderResult.data || {};
          const simsData = airaloData.sims || [];
          
          await orderRef.set({
            id: finalOrderId,
            orderId: finalOrderId,
            planId: planId,
            package_id: planId,
            status: simsData.length > 0 ? 'completed' : 'processing',
            provider: 'airalo',
            airaloOrderId: airaloData.id,
            airaloOrderData: airaloData,
            userId: userId,
            userEmail: customerEmail,
            customerEmail: customerEmail,
            paymentMethod: 'stripe',
            paymentStatus: 'completed',
            stripeSessionId: session.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
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
          });

          // Also save to user's esims subcollection if userId exists
          if (userId) {
            const userEsimRef = db.collection('users').doc(userId).collection('esims').doc(finalOrderId);
            await userEsimRef.set({
              orderId: finalOrderId,
              planId: planId,
              status: simsData.length > 0 ? 'active' : 'processing',
              customerEmail: customerEmail,
              airaloOrderId: airaloData.id,
              esimData: simsData.length > 0 ? {
                qrcode: simsData[0].qrcode,
                qrcode_url: simsData[0].qrcode_url,
                direct_apple_installation_url: simsData[0].direct_apple_installation_url,
                iccid: simsData[0].iccid,
                lpa: simsData[0].lpa,
                matching_id: simsData[0].matching_id
              } : null,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            });
          }

          // Mark pending order as processed
          await pendingOrderRef.update({
            processed: true,
            backendOrderId: finalOrderId,
            airaloOrderId: airaloData.id,
            processedAt: FieldValue.serverTimestamp()
          });

          console.log('✅ Order created and saved successfully!');
          
        } catch (apiError) {
          console.error('❌ Error calling Airalo API:', apiError);
          await pendingOrderRef.update({
            processed: false,
            error: apiError.message,
            errorAt: FieldValue.serverTimestamp()
          });
          throw apiError;
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
        return NextResponse.json({
          success: false,
          error: firebaseError.message
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

