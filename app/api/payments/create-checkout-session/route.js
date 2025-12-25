import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * Get Stripe key from environment variables
 */
function getStripeKey() {
  // Check if we're in test mode
  const isTest = process.env.STRIPE_MODE === 'test' || process.env.STRIPE_MODE === 'sandbox';
  
  let key;
  if (isTest) {
    key = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_TEST_KEY;
    console.log('🔍 Looking for Stripe TEST secret key...');
    console.log('   STRIPE_TEST_SECRET_KEY:', process.env.STRIPE_TEST_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('   STRIPE_TEST_KEY:', process.env.STRIPE_TEST_KEY ? 'SET' : 'NOT SET');
  } else {
    key = process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY;
    console.log('🔍 Looking for Stripe LIVE secret key...');
    console.log('   STRIPE_LIVE_SECRET_KEY:', process.env.STRIPE_LIVE_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('   STRIPE_KEY:', process.env.STRIPE_KEY ? 'SET' : 'NOT SET');
    console.log('   STRIPE_MODE:', process.env.STRIPE_MODE || 'not set (defaulting to live)');
  }
  
  if (!key) {
    const availableVars = Object.keys(process.env)
      .filter(k => k.includes('STRIPE') && k.includes('SECRET'))
      .join(', ');
    throw new Error(
      `Stripe ${isTest ? 'test' : 'live'} secret key not found in environment variables. ` +
      `Available Stripe env vars: ${availableVars || 'none'}. ` +
      `Please set ${isTest ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_LIVE_SECRET_KEY'} in Vercel environment variables.`
    );
  }
  
  console.log(`✅ Stripe ${isTest ? 'test' : 'live'} secret key found (length: ${key.length})`);
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
    
    // Get Stripe key and initialize Stripe
    let stripeKey;
    try {
      stripeKey = getStripeKey();
    } catch (keyError) {
      console.error('❌ Error getting Stripe key:', keyError);
      return NextResponse.json(
        {
          success: false,
          error: `Stripe configuration error: ${keyError.message}. Please ensure STRIPE_LIVE_SECRET_KEY or STRIPE_SECRET_KEY is set in environment variables.`,
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

