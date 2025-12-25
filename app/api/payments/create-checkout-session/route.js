import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * Get Stripe secret key from environment variables (Vercel Stripe integration)
 * Priority: Vercel integration STRIPE_SECRET_KEY > mode-specific keys > fallback keys
 */
function getStripeKey() {
  // Check if we're in test mode
  const isTest = process.env.STRIPE_MODE === 'test' || process.env.STRIPE_MODE === 'sandbox';
  
  console.log(`🔍 Getting Stripe ${isTest ? 'test' : 'live'} secret key from environment variables...`);
  
  let key = null;
  
  // Priority 1: Vercel Stripe Integration (automatically provided by Vercel)
  if (process.env.STRIPE_SECRET_KEY) {
    const vercelKey = process.env.STRIPE_SECRET_KEY;
    const isVercelKeyTest = vercelKey.startsWith('sk_test_');
    const isVercelKeyLive = vercelKey.startsWith('sk_live_');
    
    // Use Vercel key if mode matches or if we can't determine mode
    if ((isTest && isVercelKeyTest) || (!isTest && isVercelKeyLive) || (!isVercelKeyTest && !isVercelKeyLive)) {
      key = vercelKey;
      console.log(`✅ Using STRIPE_SECRET_KEY from Vercel integration (${isVercelKeyTest ? 'TEST' : isVercelKeyLive ? 'LIVE' : 'UNKNOWN'} mode)`);
      return key;
    } else {
      console.log(`⚠️ Vercel STRIPE_SECRET_KEY is ${isVercelKeyTest ? 'TEST' : 'LIVE'} but requested mode is ${isTest ? 'TEST' : 'LIVE'}, trying mode-specific keys...`);
    }
  }
  
  // Priority 2: Mode-specific environment variables
  if (isTest) {
    key = process.env.STRIPE_TEST_SECRET_KEY 
      || process.env.STRIPE_TEST_KEY;
    if (key) {
      console.log('✅ Using test secret key from environment variables');
      return key;
    }
  } else {
    key = process.env.STRIPE_LIVE_SECRET_KEY 
      || process.env.STRIPE_SECRET_KEY  // Fallback to Vercel key if mode-specific not found
      || process.env.STRIPE_KEY;
    if (key) {
      console.log('✅ Using live secret key from environment variables');
      return key;
    }
  }
  
  // Error if no key found
  if (!key) {
    const allStripeVars = Object.keys(process.env)
      .filter(k => k.toUpperCase().includes('STRIPE'))
      .map(k => `${k} (${process.env[k] ? 'SET' : 'NOT SET'})`)
      .join(', ');
    throw new Error(
      `Stripe ${isTest ? 'test' : 'live'} secret key not found.\n` +
      `Checked environment variables: ${allStripeVars || 'none found'}.\n` +
      `💡 Solution: Connect Stripe integration in Vercel (provides STRIPE_SECRET_KEY automatically) ` +
      `or set ${isTest ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_LIVE_SECRET_KEY'} in Vercel environment variables.`
    );
  }
  
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
    
    // Get Stripe key and initialize Stripe (from Vercel integration or environment variables)
    let stripeKey;
    try {
      stripeKey = getStripeKey();
      console.log('🔑 Stripe key retrieved:', stripeKey ? `Found (length: ${stripeKey.length})` : 'NOT FOUND');
    } catch (keyError) {
      console.error('❌ Error getting Stripe key:', keyError);
      console.error('❌ Error stack:', keyError.stack);
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
      console.error('❌ Stripe key is null or undefined');
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe secret key not configured. Please connect Stripe integration in Vercel or set STRIPE_SECRET_KEY/STRIPE_LIVE_SECRET_KEY in environment variables.',
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
    
    if (typeof stripeKey !== 'string' || stripeKey.trim().length === 0) {
      console.error('❌ Stripe key is invalid:', typeof stripeKey, stripeKey);
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe secret key is invalid. Please check your configuration.',
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
    
    console.log('🔐 Initializing Stripe with key:', stripeKey.substring(0, 7) + '...');
    let stripe;
    try {
      stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
      console.log('✅ Stripe initialized successfully');
    } catch (stripeInitError) {
      console.error('❌ Error initializing Stripe:', stripeInitError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to initialize Stripe: ${stripeInitError.message}`,
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
    
    if (!stripe || !stripe.checkout || !stripe.checkout.Session) {
      console.error('❌ Stripe object is invalid:', { hasStripe: !!stripe, hasCheckout: !!stripe?.checkout, hasSession: !!stripe?.checkout?.Session });
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe initialization failed. Please check your Stripe key.',
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
    
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

