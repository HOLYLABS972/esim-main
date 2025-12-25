import { NextResponse } from 'next/server';
import { db } from '../../../src/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Airalo } from 'airalo-sdk';

export const dynamic = 'force-dynamic';

/**
 * Authenticate Firebase ID token
 * Uses Firebase Admin SDK if available
 */
async function authenticateFirebaseToken(idToken) {
  try {
    // Try to use Firebase Admin if available
    const adminApp = await import('firebase-admin/app').catch(() => null);
    const adminAuth = await import('firebase-admin/auth').catch(() => null);
    
    if (!adminApp || !adminAuth) {
      console.log('⚠️ Firebase Admin not available - auth verification disabled');
      return null;
    }

    if (!adminApp.getApps().length) {
      // Try to initialize if not already initialized
      try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
          : undefined;
        
        if (serviceAccount) {
          adminApp.initializeApp({
            credential: adminApp.cert(serviceAccount)
          });
        } else {
          // Use default credentials (for Firebase hosting/Cloud Run/Vercel)
          adminApp.initializeApp();
        }
      } catch (initError) {
        console.log('⚠️ Firebase Admin initialization failed:', initError.message);
        return null;
      }
    }

    const decodedToken = await adminAuth.getAuth().verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      type: 'regular_user'
    };
  } catch (error) {
    console.log('⚠️ Firebase token authentication failed:', error.message);
    return null;
  }
}

/**
 * Get Airalo credentials from Firestore config
 */
async function getAiraloCredentials() {
  try {
    const configRef = doc(db, 'config', 'airalo');
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const configData = configDoc.data();
      const clientId = configData.api_key || configData.client_id;
      const clientSecret = configData.client_secret || configData.secret;
      
      if (clientId && clientSecret) {
        return { clientId, clientSecret };
      }
    }
    
    // Fallback to environment variables
    const envClientId = process.env.AIRALO_CLIENT_ID || process.env.AIRALO_API_KEY;
    const envClientSecret = process.env.AIRALO_CLIENT_SECRET || process.env.AIRALO_SECRET || process.env.AIRALO_CLIENT_SECRET_PRODUCTION;
    
    if (envClientId && envClientSecret) {
      return { clientId: envClientId, clientSecret: envClientSecret };
    }
    
    throw new Error('Airalo credentials not found in Firestore config or environment variables');
  } catch (error) {
    console.error('❌ Error getting Airalo credentials:', error);
    throw error;
  }
}

/**
 * Initialize Airalo SDK instance
 */
async function getAiraloSdk() {
  try {
    const { clientId, clientSecret } = await getAiraloCredentials();
    
    const airalo = new Airalo({
      client_id: clientId,
      client_secret: clientSecret,
      env: 'production' // Use 'sandbox' for testing
    });
    
    await airalo.initialize();
    console.log('✅ Airalo SDK initialized successfully');
    
    return airalo;
  } catch (error) {
    console.error('❌ Error initializing Airalo SDK:', error);
    throw error;
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Get user balance from Airalo API
 * Requires authentication
 */
export async function GET(request) {
  console.log('🚀 GET /api/user/balance - Route handler called');
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Require authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid authorization header',
        },
        { 
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    const idToken = authHeader.substring(7);
    const user = await authenticateFirebaseToken(idToken);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { 
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    console.log(`🔐 Authenticated user: ${user.email}`);

    try {
      // Initialize Airalo SDK
      const airalo = await getAiraloSdk();
      
      // Fetch balance using SDK's access token for direct API call
      console.log(`📡 Fetching balance from Airalo API using SDK credentials`);
      
      let balanceInfo = null;
      
      try {
        // Get access token from SDK (SDK handles auth internally)
        let accessToken = null;
        
        // Try to get access token from SDK if it exposes it
        if (typeof airalo.getAccessToken === 'function') {
          accessToken = await airalo.getAccessToken();
        } else if (airalo.accessToken) {
          accessToken = airalo.accessToken;
        } else {
          // SDK doesn't expose token, get credentials and make direct API call
          const { clientId, clientSecret } = await getAiraloCredentials();
          const tokenResponse = await fetch('https://partners-api.airalo.com/v2/token', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'client_credentials'
            }),
            signal: AbortSignal.timeout(30000)
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            accessToken = tokenData.data?.access_token;
          }
        }
        
        if (!accessToken) {
          throw new Error('Failed to get Airalo access token');
        }
        
        // Fetch balance using access token
        const balanceResponse = await fetch(
          `https://partners-api.airalo.com/v2/balance`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(30000)
          }
        );
        
        console.log(`📡 Balance API response status: ${balanceResponse.status}`);
        
        if (!balanceResponse.ok) {
          const errorText = await balanceResponse.text();
          console.error(`❌ Balance API error: ${balanceResponse.status} - ${errorText}`);
          return NextResponse.json(
            {
              success: false,
              error: `Airalo API error: ${balanceResponse.status}`,
              details: errorText.substring(0, 200),
            },
            { 
              status: balanceResponse.status,
              headers: corsHeaders,
            }
          );
        }
        
        const balanceData = await balanceResponse.json();
        console.log(`✅ Got balance data from Airalo API`);
        
        if (!balanceData.data) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid response format from Airalo API',
            },
            { 
              status: 500,
              headers: corsHeaders,
            }
          );
        }
        
        balanceInfo = balanceData.data;
      } catch (apiError) {
        console.error(`❌ Failed to get balance: ${apiError.message}`);
        throw apiError;
      }

      if (!balanceInfo) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid response format from Airalo SDK/API',
          },
          { 
            status: 500,
            headers: corsHeaders,
          }
        );
      }
      const balance = parseFloat(balanceInfo.balance || 0);
      const minimumRequired = parseFloat(balanceInfo.minimum_required || 4.0);

      return NextResponse.json(
        {
          success: true,
          balance: balance,
          hasInsufficientFunds: balance < minimumRequired,
          minimumRequired: minimumRequired,
          mode: 'production',
        },
        {
          status: 200,
          headers: corsHeaders,
        }
      );

    } catch (error) {
      console.error('❌ Error fetching balance from Airalo:', error);
      
      if (error.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout - Airalo API did not respond in time',
          },
          { 
            status: 504,
            headers: corsHeaders,
          }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch balance from Airalo',
        },
        { 
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  } catch (error) {
    console.error('❌ Unexpected error in balance endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch balance',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

