import { NextResponse } from 'next/server';

// API URLs - check both environment variable names for compatibility
const API_PRODUCTION_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://sdk.roamjet.net';
const API_SANDBOX_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL || process.env.API_SANDBOX_URL || 'https://sandbox.roamjet.net';
// Data usage server URL - dedicated server for mobile data/balance checks
const DATA_API_URL = process.env.NEXT_PUBLIC_DATA_API_URL || process.env.DATA_API_URL || 'https://data.roamjet.net';

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
 * Get the data API base URL (always uses dedicated data server)
 */
const getDataApiBaseUrl = () => {
  return DATA_API_URL;
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
 * Handle GET request (for testing/debugging)
 */
export async function GET(request) {
  return NextResponse.json({
    success: true,
    message: 'Mobile data API endpoint is active',
    endpoint: '/api/user/mobile-data',
    method: 'POST',
    dataServer: getDataApiBaseUrl(),
  });
}

/**
 * Proxy mobile-data requests to external API
 * This avoids CORS issues by making the request server-side
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

    // Use dedicated data server for mobile-data requests
    const dataApiBaseUrl = getDataApiBaseUrl();
    
    // Try both possible endpoint paths
    const endpointPath = '/api/user/mobile-data';
    const fullUrl = `${dataApiBaseUrl}${endpointPath}`;
    
    console.log(`🌐 Proxying mobile-data request to: ${fullUrl}`);
    console.log(`🔍 Data API Base URL: ${dataApiBaseUrl}`);
    console.log(`📡 Using dedicated data server: ${dataApiBaseUrl}`);
    
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
      
      // Check if response is JSON (even if 404, the data server returns JSON)
      const contentType = response.headers.get('content-type');
      const isJsonResponse = contentType && contentType.includes('application/json');
      
      // If 404 and NOT JSON, try alternative endpoint (true 404 = endpoint not found)
      // If 404 but JSON, it's a valid response from the data server (SIM not found)
      if (response.status === 404 && !isJsonResponse) {
        const altEndpointPath = '/api/mobile-data';
        const altFullUrl = `${dataApiBaseUrl}${altEndpointPath}`;
        console.log(`⚠️ 404 with non-JSON response, trying alternative endpoint: ${altFullUrl}`);
        
        const altResponse = await fetch(altFullUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ iccid, orderId }),
        });
        
        if (altResponse.ok || (altResponse.status === 404 && altResponse.headers.get('content-type')?.includes('application/json'))) {
          console.log(`✅ Alternative endpoint responded: ${altResponse.status}`);
          response = altResponse;
        } else {
          console.error(`❌ Alternative endpoint also returned ${altResponse.status}`);
        }
      } else if (response.status === 404 && isJsonResponse) {
        console.log(`ℹ️ 404 with JSON response - this is a valid response from data server (SIM not found)`);
        console.log(`📋 Content-Type: ${contentType}`);
        console.log(`📋 Response status: ${response.status}`);
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
    console.log(`📋 Final response status: ${response.status}, Content-Type: ${contentType}`);
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
    // If the data server returns 404 with JSON (SIM not found), return 200 OK
    // so the client can handle the error message in the JSON body
    // Only forward 404 status if it's a true endpoint not found (non-JSON)
    const isJson404 = response.status === 404 && contentType && contentType.includes('application/json');
    const statusCode = isJson404 ? 200 : response.status;
    
    if (isJson404) {
      console.log(`✅ Converting 404 JSON response to 200 OK for client`);
      console.log(`📦 Response data:`, JSON.stringify(data).substring(0, 200));
    }
    
    return NextResponse.json(data, {
      status: statusCode,
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

