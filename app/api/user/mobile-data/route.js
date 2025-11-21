import { NextResponse } from 'next/server';

// API URLs - check both environment variable names for compatibility
const API_PRODUCTION_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://sdk.roamjet.net';
const API_SANDBOX_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL || process.env.API_SANDBOX_URL || 'https://sandbox.roamjet.net';

/**
 * Get the correct API base URL based on mode
 * For server-side, we default to production unless explicitly set
 * The client-side code handles mode detection, but we can accept it as a parameter
 */
const getApiBaseUrl = (mode) => {
  // If mode is explicitly provided (from query param or header), use it
  if (mode === 'test' || mode === 'sandbox') {
    return API_SANDBOX_URL;
  }
  // Default to production
  return API_PRODUCTION_URL;
};

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(request) {
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
 * Proxy mobile-data requests to external API
 * This avoids CORS issues by making the request server-side
 */
export async function POST(request) {
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

    // Check for mode in query params or default to production
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');
    const apiBaseUrl = getApiBaseUrl(mode);
    
    // Try both possible endpoint paths
    const endpointPath = '/api/user/mobile-data';
    const fullUrl = `${apiBaseUrl}${endpointPath}`;
    
    console.log(`🌐 Proxying mobile-data request to: ${fullUrl}`);
    console.log(`🔍 API Base URL: ${apiBaseUrl}`);
    console.log(`🔍 Mode: ${mode || 'production (default)'}`);
    
    const headers = {
      'Content-Type': 'application/json',
    };

    // Try to get auth token from the request if available
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
      console.log('🔐 Forwarding auth token to external API');
    } else {
      console.log('👤 No auth token found, making guest request');
    }

    // Forward the request to the external API
    let response;
    try {
      response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ iccid, orderId }),
      });
      
      console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
      
      // If 404, try alternative endpoint path (without /user)
      if (response.status === 404) {
        const altEndpointPath = '/api/mobile-data';
        const altFullUrl = `${apiBaseUrl}${altEndpointPath}`;
        console.log(`⚠️ 404 received, trying alternative endpoint: ${altFullUrl}`);
        
        const altResponse = await fetch(altFullUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ iccid, orderId }),
        });
        
        if (altResponse.ok || altResponse.status !== 404) {
          console.log(`✅ Alternative endpoint responded: ${altResponse.status}`);
          response = altResponse;
        } else {
          console.error(`❌ Alternative endpoint also returned ${altResponse.status}`);
        }
      }
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      console.error('❌ Failed URL:', fullUrl);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to connect to API: ${fetchError.message}`,
          details: `Attempted URL: ${fullUrl}`,
        },
        { 
          status: 503,
          headers: corsHeaders,
        }
      );
    }

    // Handle response
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        const text = await response.text().catch(() => 'Unable to read response');
        console.error('❌ Response text:', text);
        return NextResponse.json(
          {
            success: false,
            error: `API returned invalid JSON: ${response.status} ${response.statusText}`,
          },
          {
            status: response.status || 500,
            headers: corsHeaders,
          }
        );
      }
    } else {
      // Non-JSON response
      const text = await response.text().catch(() => 'Unable to read response');
      console.error('❌ Non-JSON response from API:', text);
      console.error('❌ Response status:', response.status, response.statusText);
      console.error('❌ Response URL:', fullUrl);
      return NextResponse.json(
        {
          success: false,
          error: `API returned non-JSON response: ${response.status} ${response.statusText}`,
          details: text.substring(0, 200), // Limit details length
          attemptedUrl: fullUrl,
        },
        {
          status: response.status || 500,
          headers: corsHeaders,
        }
      );
    }

    // Return the response with CORS headers
    return NextResponse.json(data, {
      status: response.status,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('❌ Unexpected error proxying mobile-data request:', error);
    console.error('❌ Error stack:', error.stack);
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

