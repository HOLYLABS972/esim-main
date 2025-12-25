import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

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
        // Use default credentials (for Firebase hosting/Cloud Run/Vercel)
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

/**
 * Get Stripe key from Firestore remote config (like other apps) or environment variables
 */
async function getStripeKey() {
  // Check if we're in test mode
  const isTest = process.env.STRIPE_MODE === 'test' || process.env.STRIPE_MODE === 'sandbox';
  
  console.log(`🔍 Getting Stripe ${isTest ? 'test' : 'live'} secret key...`);
  
  let key = null;
  
  // First, try Firestore remote config (like other apps)
  try {
    const firestore = await getFirestore();
    const { doc, getDoc } = await import('firebase-admin/firestore');
    
    const configRef = doc(firestore, 'config', 'stripe');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const configData = configDoc.data();
      console.log('📋 Stripe config found in Firestore');
      
      if (isTest) {
        key = configData.testSecretKey || configData.test_secret_key;
        if (key) {
          console.log('✅ Using TEST secret key from Firestore remote config');
          return key;
        }
      } else {
        key = configData.liveSecretKey || configData.live_secret_key;
        if (key) {
          console.log('✅ Using LIVE secret key from Firestore remote config');
          return key;
        }
      }
      
      console.log(`⚠️ No ${isTest ? 'test' : 'live'} secret key found in Firestore config`);
    } else {
      console.log('📝 No Stripe config document found in Firestore');
    }
  } catch (firestoreError) {
    console.warn('⚠️ Could not load from Firestore remote config:', firestoreError.message);
  }
  
  // Fallback to environment variables
  console.log('🔍 Falling back to environment variables...');
  
  if (isTest) {
    key = process.env.STRIPE_TEST_SECRET_KEY 
      || process.env.STRIPE_TEST_KEY
      || process.env.NEXT_PUBLIC_STRIPE_TEST_SECRET_KEY
      || process.env.NEXT_PUBLIC_STRIPE_TEST_KEY;
    console.log('   STRIPE_TEST_SECRET_KEY:', process.env.STRIPE_TEST_SECRET_KEY ? 'SET ✅' : 'NOT SET');
    console.log('   STRIPE_TEST_KEY:', process.env.STRIPE_TEST_KEY ? 'SET ✅' : 'NOT SET');
    console.log('   NEXT_PUBLIC_STRIPE_TEST_SECRET_KEY:', process.env.NEXT_PUBLIC_STRIPE_TEST_SECRET_KEY ? 'SET ⚠️' : 'NOT SET');
  } else {
    key = process.env.STRIPE_LIVE_SECRET_KEY 
      || process.env.STRIPE_SECRET_KEY 
      || process.env.STRIPE_KEY
      || process.env.NEXT_PUBLIC_STRIPE_LIVE_SECRET_KEY
      || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY
      || process.env.NEXT_PUBLIC_STRIPE_KEY;
    console.log('   STRIPE_LIVE_SECRET_KEY:', process.env.STRIPE_LIVE_SECRET_KEY ? 'SET ✅' : 'NOT SET');
    console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET ✅' : 'NOT SET');
    console.log('   STRIPE_KEY:', process.env.STRIPE_KEY ? 'SET ✅' : 'NOT SET');
    console.log('   NEXT_PUBLIC_STRIPE_LIVE_SECRET_KEY:', process.env.NEXT_PUBLIC_STRIPE_LIVE_SECRET_KEY ? 'SET ⚠️' : 'NOT SET');
    console.log('   STRIPE_MODE:', process.env.STRIPE_MODE || 'not set (defaulting to live)');
  }
  
  if (!key) {
    // List all Stripe-related env vars for debugging
    const allStripeVars = Object.keys(process.env)
      .filter(k => k.toUpperCase().includes('STRIPE'))
      .map(k => `${k} (${process.env[k] ? 'SET' : 'NOT SET'})`)
      .join(', ');
    throw new Error(
      `Stripe ${isTest ? 'test' : 'live'} secret key not found.\n` +
      `Checked: Firestore remote config (config/stripe) and environment variables.\n` +
      `Environment variables found: ${allStripeVars || 'none'}.\n` +
      `💡 Solution: Add ${isTest ? 'testSecretKey' : 'liveSecretKey'} to Firestore config/stripe document, ` +
      `or set ${isTest ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_LIVE_SECRET_KEY'} in Vercel environment variables.`
    );
  }
  
  // Warn if using NEXT_PUBLIC_ prefix (not secure for secret keys)
  if (key && (process.env.NEXT_PUBLIC_STRIPE_TEST_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_LIVE_SECRET_KEY)) {
    console.warn('⚠️ WARNING: Using NEXT_PUBLIC_ prefix for secret key is not recommended for security!');
  }
  
  console.log(`✅ Stripe ${isTest ? 'test' : 'live'} secret key found from ${key === process.env.NEXT_PUBLIC_STRIPE_TEST_SECRET_KEY || key === process.env.NEXT_PUBLIC_STRIPE_LIVE_SECRET_KEY ? 'environment variables' : 'Firestore'} (length: ${key.length})`);
  return key;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await request.json();
    const { order, email, name, total, currency = 'usd', domain, plan, isYearly } = body;
    
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!total) {
      return NextResponse.json(
        { success: false, error: 'Total amount is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Get Stripe key and initialize Stripe (from Firestore remote config or environment variables)
    let stripeKey;
    try {
      stripeKey = await getStripeKey();
    } catch (keyError) {
      console.error('❌ Error getting Stripe key:', keyError);
      return NextResponse.json(
        {
          success: false,
          error: `Stripe configuration error: ${keyError.message}`,
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
    
    if (!stripeKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe secret key not configured. Please set STRIPE_LIVE_SECRET_KEY or STRIPE_SECRET_KEY in environment variables.',
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    
    const domainClean = domain.replace(/\/$/, '');
    const currencyLower = currency.toLowerCase();
    const totalAmount = Math.round(parseFloat(total) * 100);
    
    let session;
    
    if (isYearly !== undefined && isYearly !== null) {
      // Subscription payment
      const interval = isYearly ? 'year' : 'month';
      session = await stripe.checkout.Session.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currencyLower,
            product_data: {
              name: `Subscription Plan - ${order}`,
              description: `${isYearly ? 'Annual' : 'Monthly'} subscription plan`
            },
            unit_amount: totalAmount,
            recurring: {
              interval: interval,
              interval_count: 1
            }
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${domainClean}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${order}`,
        cancel_url: `${domainClean}/subscriptions`,
        customer_email: email,
        billing_address_collection: 'required',
        allow_promotion_codes: true,
        subscription_data: {
          description: `${isYearly ? 'Annual' : 'Monthly'} subscription for ${email}`,
          metadata: {
            order_id: order,
            plan_type: isYearly ? 'yearly' : 'monthly'
          }
        }
      });
    } else {
      // One-time payment
      session = await stripe.checkout.Session.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currencyLower,
            product_data: {
              name: `Order ${order}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${domainClean}/payment-success?order=${order}&email=${email}&total=${total}&name=${name}&currency=${currency}`,
        cancel_url: `${domainClean}/cart`,
        customer_email: email,
        metadata: {
          order_id: order,
          email: email,
          name: name,
          plan_id: plan || ''
        }
      });
    }
    
    return NextResponse.json({
      sessionUrl: session.url,
      sessionId: session.id,
      total: total,
      currency: currency,
      status: 'success'
    }, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create checkout session',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

