import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Authenticate Firebase ID token (optional - supports guest users)
 * Uses Firebase Admin SDK if available, otherwise skips auth
 */
async function authenticateFirebaseToken(idToken) {
  try {
    // Try to use Firebase Admin if available
    const adminApp = await import('firebase-admin/app').catch(() => null);
    const adminAuth = await import('firebase-admin/auth').catch(() => null);
    
    if (!adminApp || !adminAuth) {
      console.log('⚠️ Firebase Admin not available - skipping auth verification');
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Handle GET request (for testing/debugging)
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Mobile data API endpoint is active',
    endpoint: '/api/user/mobile-data',
    method: 'POST',
    description: 'Get mobile data usage for eSIM by ICCID',
    note: 'Uses Airalo API directly - no external server required',
  });
}

/**
 * Get mobile data usage/status for eSIM using Airalo API
 * Supports both authenticated and guest users
 */
export async function POST(request) {
  console.log('🚀 POST /api/user/mobile-data - Route handler called');
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Expected JSON.',
        },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { iccid, orderId } = body || {};

    if (!iccid && !orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either iccid or orderId is required',
        },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Authenticate user if token provided (optional - supports guest users)
    let user = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);
      try {
        user = await authenticateFirebaseToken(idToken);
        if (user) {
          console.log(`🔐 Authenticated user: ${user.email}`);
        }
      } catch (authError) {
        console.log(`⚠️ Authentication failed, continuing as guest: ${authError.message}`);
      }
    } else {
      console.log('👤 Processing request as public user (no authentication)');
    }

    // Require ICCID - if only orderId provided, we can't look it up without Firestore
    if (orderId && !iccid) {
      console.log('⚠️ OrderId provided but no ICCID - cannot look up without Firestore. Please provide ICCID directly.');
    }

    if (!iccid) {
      return NextResponse.json(
        {
          success: false,
          error: 'iccid is required',
        },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    console.log(`🚀 Getting mobile data status via Airalo SDK for ICCID: ${iccid}`);

    try {
      // Get access token directly (no SDK to avoid cache directory issues in serverless)
      console.log(`📡 Fetching SIM usage from Airalo API`);
      
      const accessToken = await getAiraloAccessToken();
      
      // Fetch SIM usage using access token (direct API call like Python server)
      const usageResponse = await fetch(
        `https://partners-api.airalo.com/v2/sims/${iccid}/usage`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000)
        }
      );
      
      console.log(`📡 SIM usage API response status: ${usageResponse.status}`);
      
      if (usageResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: `No data found for ICCID: ${iccid}. The SIM may not exist or may not be accessible.`,
          },
          { 
            status: 404,
            headers: corsHeaders,
          }
        );
      }
      
      if (!usageResponse.ok) {
        const errorText = await usageResponse.text();
        console.error(`❌ SIM usage API error: ${usageResponse.status} - ${errorText}`);
        return NextResponse.json(
          {
            success: false,
            error: `Airalo API error: ${usageResponse.status}`,
            details: errorText.substring(0, 200),
          },
          { 
            status: usageResponse.status,
            headers: corsHeaders,
          }
        );
      }
      
      const usageData = await usageResponse.json();
      console.log(`✅ Got SIM usage data from Airalo API`);
      
      if (!usageData.data) {
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
      
      const simData = usageData.data;

      if (!simData) {
        return NextResponse.json(
          {
            success: false,
            error: `No data found for ICCID: ${iccid}. The SIM may not exist or may not be accessible.`,
          },
          { 
            status: 404,
            headers: corsHeaders,
          }
        );
      }

      // Process SIM usage data (format: remaining, total, expired_at, status)
      const totalMb = parseFloat(simData.total || 0);
      const remainingMb = parseFloat(simData.remaining || 0);
      const usedMb = totalMb - remainingMb;
      const usagePercentage = totalMb > 0 ? (usedMb / totalMb * 100) : 0;

      const mobileDataResponse = {
        iccid: iccid,
        status: (simData.status || 'active').toUpperCase(),
        dataUsed: `${Math.round(usedMb)}MB`,
        dataRemaining: `${Math.round(remainingMb)}MB`,
        dataTotal: `${Math.round(totalMb)}MB`,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        daysUsed: 0, // Not available in usage API
        daysRemaining: 0, // Not available in usage API
        expiresAt: simData.expired_at || '',
        lastUpdated: '',
      };

      console.log(`✅ Mobile data status retrieved successfully`);

      return NextResponse.json(
        {
          success: true,
          data: mobileDataResponse,
          isTestMode: false,
        },
        {
          status: 200,
          headers: corsHeaders,
        }
      );

    } catch (error) {
      console.error('❌ Error fetching SIM usage from Airalo:', error);
      
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
          error: error.message || 'Failed to fetch mobile data from Airalo',
        },
        { 
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  } catch (error) {
    console.error('❌ Unexpected error in mobile-data endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch mobile data',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

