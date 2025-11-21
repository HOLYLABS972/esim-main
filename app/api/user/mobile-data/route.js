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
  try {
    const body = await request.json();
    const { iccid, orderId } = body;

    if (!iccid && !orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either iccid or orderId is required',
        },
        { status: 400 }
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    const headers = {
      'Content-Type': 'application/json',
    };

    // Try to get auth token from the request if available
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward the request to the external API
    const response = await fetch(`${apiBaseUrl}/api/user/mobile-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ iccid, orderId }),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, return error
      const text = await response.text();
      console.error('❌ Non-JSON response from API:', text);
      return NextResponse.json(
        {
          success: false,
          error: `API returned non-JSON response: ${response.status} ${response.statusText}`,
        },
        {
          status: response.status || 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Return the response with CORS headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('❌ Error proxying mobile-data request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch mobile data',
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

