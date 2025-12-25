import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * Get Stripe key from Firebase Remote Config (like mobile app) or environment variables
 */
async function getStripeKey() {
  // Check if we're in test mode
  const isTest = process.env.STRIPE_MODE === 'test' || process.env.STRIPE_MODE === 'sandbox';
  
  console.log(`🔍 Getting Stripe ${isTest ? 'test' : 'live'} secret key...`);
  
  let key = null;
  
  // First, try Firebase Remote Config (like mobile app)
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'esim-f0e3e';
    
    // Get access token for Firebase Remote Config API
    let accessToken = null;
    
    try {
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/firebase.remoteconfig'],
        projectId: projectId
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      accessToken = tokenResponse.token;
    } catch (authError) {
      console.warn('⚠️ Could not get access token for Remote Config:', authError.message);
    }
    
    if (accessToken) {
      // Fetch Remote Config values using REST API
      const remoteConfigUrl = `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`;
      const response = await fetch(remoteConfigUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const remoteConfig = await response.json();
        const parameters = remoteConfig.parameters || {};
        
        console.log('📋 Firebase Remote Config fetched successfully');
        console.log('📋 Remote Config structure:', JSON.stringify(remoteConfig, null, 2).substring(0, 500));
        console.log('📋 Available parameter keys:', Object.keys(parameters).join(', ') || 'none');
        
        // Log all parameter names for debugging
        if (Object.keys(parameters).length > 0) {
          console.log('📋 All parameters:', Object.keys(parameters));
          // Log first parameter structure to understand format
          const firstParam = Object.keys(parameters)[0];
          console.log(`📋 Sample parameter "${firstParam}" structure:`, JSON.stringify(parameters[firstParam], null, 2));
        }
        
        // Use the same parameter names as Python functions and mobile app
        // Python functions use: 'stripe_test_key' and 'stripe_server_key'
        const paramName = isTest ? 'stripe_test_key' : 'stripe_server_key';
        const param = parameters[paramName];
        
        if (param) {
          console.log(`🔍 Found parameter "${paramName}", structure:`, Object.keys(param));
          
          // Try serverValue first (for server-side parameters) - like Python functions do
          if (param.serverValue) {
            const serverVal = param.serverValue;
            if (typeof serverVal === 'object' && serverVal.value) {
              key = serverVal.value;
              console.log(`✅ Found ${isTest ? 'TEST' : 'LIVE'} secret key from serverValue (length: ${key.length})`);
            } else if (typeof serverVal === 'string') {
              key = serverVal;
              console.log(`✅ Found ${isTest ? 'TEST' : 'LIVE'} secret key from serverValue (length: ${key.length})`);
            }
          }
          
          // Fallback to defaultValue (for client-side parameters) - like Python functions do
          if (!key && param.defaultValue) {
            const defaultVal = param.defaultValue;
            if (typeof defaultVal === 'object' && defaultVal.value) {
              key = defaultVal.value;
              console.log(`✅ Found ${isTest ? 'TEST' : 'LIVE'} secret key from defaultValue (length: ${key.length})`);
            } else if (typeof defaultVal === 'string') {
              key = defaultVal;
              console.log(`✅ Found ${isTest ? 'TEST' : 'LIVE'} secret key from defaultValue (length: ${key.length})`);
            }
          }
          
          if (key) {
            console.log(`✅ Using ${isTest ? 'TEST' : 'LIVE'} secret key from Firebase Remote Config (parameter: "${paramName}")`);
            return key;
          } else {
            console.log(`⚠️ Parameter "${paramName}" exists but has no serverValue or defaultValue`);
            console.log(`   Parameter structure:`, JSON.stringify(param, null, 2));
          }
        } else {
          // Also try alternative names as fallback
          const altParamNames = isTest 
            ? ['stripe_test_secret_key', 'stripeTestSecretKey']
            : ['stripe_live_secret_key', 'stripeLiveSecretKey', 'stripe_live_key'];
          
          for (const altName of altParamNames) {
            const altParam = parameters[altName];
            if (altParam) {
              console.log(`🔍 Found alternative parameter "${altName}"`);
              // Try same extraction logic
              if (altParam.serverValue) {
                const serverVal = altParam.serverValue;
                key = (typeof serverVal === 'object' && serverVal.value) ? serverVal.value : (typeof serverVal === 'string' ? serverVal : null);
              }
              if (!key && altParam.defaultValue) {
                const defaultVal = altParam.defaultValue;
                key = (typeof defaultVal === 'object' && defaultVal.value) ? defaultVal.value : (typeof defaultVal === 'string' ? defaultVal : null);
              }
              if (key) {
                console.log(`✅ Using ${isTest ? 'TEST' : 'LIVE'} secret key from alternative parameter "${altName}"`);
                return key;
              }
            }
          }
        }
        
        console.log(`⚠️ No ${isTest ? 'test' : 'live'} secret key found in Remote Config`);
        console.log(`   Looking for: "${isTest ? 'stripe_test_key' : 'stripe_server_key'}" (same as Python functions)`);
      } else {
        const errorText = await response.text();
        console.error('❌ Could not fetch Remote Config:', response.status, errorText);
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
      }
    }
  } catch (remoteConfigError) {
    console.warn('⚠️ Could not load from Firebase Remote Config:', remoteConfigError.message);
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
      `Checked: Firebase Remote Config parameter "${isTest ? 'stripe_test_secret_key' : 'stripe_live_secret_key'}" (not found or not published).\n` +
      `Also checked environment variables: ${allStripeVars || 'none found'}.\n` +
      `💡 Solution: Add parameter "${isTest ? 'stripe_test_key' : 'stripe_server_key'}" to Firebase Remote Config and PUBLISH it. ` +
      `Go to Firebase Console → Remote Config → Add parameter → Name: "${isTest ? 'stripe_test_key' : 'stripe_server_key'}" → Value: "sk_${isTest ? 'test' : 'live'}_..." → Publish. ` +
      `(Note: Use "stripe_test_key" and "stripe_server_key" - same names as Python functions)`
    );
  }
  
  // Warn if using NEXT_PUBLIC_ prefix (not secure for secret keys)
  if (key && (process.env.NEXT_PUBLIC_STRIPE_TEST_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_LIVE_SECRET_KEY)) {
    console.warn('⚠️ WARNING: Using NEXT_PUBLIC_ prefix for secret key is not recommended for security!');
  }
  
  const source = key === process.env.NEXT_PUBLIC_STRIPE_TEST_SECRET_KEY || key === process.env.NEXT_PUBLIC_STRIPE_LIVE_SECRET_KEY 
    ? 'environment variables' 
    : (key === process.env.STRIPE_TEST_SECRET_KEY || key === process.env.STRIPE_LIVE_SECRET_KEY || key === process.env.STRIPE_SECRET_KEY || key === process.env.STRIPE_KEY
      ? 'environment variables'
      : 'Firebase Remote Config');
  console.log(`✅ Stripe ${isTest ? 'test' : 'live'} secret key found from ${source} (length: ${key.length})`);
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
    
    // Get Stripe key and initialize Stripe (from Firebase Remote Config or environment variables)
    let stripeKey;
    try {
      stripeKey = await getStripeKey();
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
          error: 'Stripe secret key not configured. Please add stripe_live_secret_key to Firebase Remote Config or set STRIPE_LIVE_SECRET_KEY in environment variables.',
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

