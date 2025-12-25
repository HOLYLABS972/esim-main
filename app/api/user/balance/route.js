import { NextResponse } from 'next/server';

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
 * Get Airalo credentials from Vercel environment variables (like before)
 * This matches the pattern used in admin-app API routes
 */
async function getAiraloCredentials() {
  // Use Vercel environment variables directly (same as admin-app)
  const clientId = process.env.AIRALO_CLIENT_ID || process.env.AIRALO_API_KEY;
  const clientSecret = process.env.AIRALO_CLIENT_SECRET || process.env.AIRALO_SECRET || process.env.AIRALO_CLIENT_SECRET_PRODUCTION;
  
  console.log(`🔧 Using Airalo credentials from Vercel env vars - Client ID: ${clientId ? clientId.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`🔑 Client Secret: ${clientSecret ? 'SET' : 'NOT SET'}`);
  
  if (!clientId) {
    throw new Error('Airalo API key not found. Please set AIRALO_CLIENT_ID or AIRALO_API_KEY in Vercel environment variables.');
  }
  
  if (!clientSecret) {
    throw new Error('Airalo client secret not found. Please set AIRALO_CLIENT_SECRET, AIRALO_SECRET, or AIRALO_CLIENT_SECRET_PRODUCTION in Vercel environment variables.');
  }
  
  return { clientId, clientSecret };
}

/**
 * Get Airalo access token directly (no SDK - avoids cache directory issues in serverless)
 */
async function getAiraloAccessToken() {
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
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Airalo authentication failed: ${tokenResponse.status} - ${errorText}`);
  }
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.data?.access_token;
  
  if (!accessToken) {
    throw new Error('No access token received from Airalo');
  }
  
  return accessToken;
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
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
      // Get access token directly (no SDK to avoid cache directory issues in serverless)
      console.log(`📡 Fetching balance from Airalo API`);
      
      const accessToken = await getAiraloAccessToken();
      
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
      
      const balanceInfo = balanceData.data;

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

