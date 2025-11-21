import { NextResponse } from 'next/server';

const API_PRODUCTION_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sdk.roamjet.net';
const API_SANDBOX_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL || 'https://sandbox.roamjet.net';

/**
 * Get the correct API base URL based on mode
 * This is a simplified version - defaults to production
 * In a full implementation, you might want to check Firestore for stripe mode
 */
const getApiBaseUrl = () => {
  // Default to production, can be enhanced to check Firestore config
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

    const apiBaseUrl = getApiBaseUrl();
    console.log(`🌐 Proxying mobile-data request to: ${apiBaseUrl}/api/user/mobile-data`);
    
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
      response = await fetch(`${apiBaseUrl}/api/user/mobile-data`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ iccid, orderId }),
      });
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to connect to API: ${fetchError.message}`,
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
      return NextResponse.json(
        {
          success: false,
          error: `API returned non-JSON response: ${response.status} ${response.statusText}`,
          details: text.substring(0, 200), // Limit details length
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

