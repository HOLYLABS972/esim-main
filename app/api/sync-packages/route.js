import { NextResponse } from 'next/server';
import fs from 'fs';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    let credential;
    
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'esim-f0e3e',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } else {
      if (fs.existsSync('./esim-service.json')) {
        credential = admin.credential.cert('./esim-service.json');
      }
    }

    if (credential) {
      admin.initializeApp({
        credential,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'esim-f0e3e',
      });
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request) {
  try {
    // Get the Firebase ID token from the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid Authorization header' },
        { status: 401, headers: corsHeaders }
      );
    }

    const idToken = authHeader.substring(7);

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `Invalid token: ${error.message}` },
        { status: 401, headers: corsHeaders }
      );
    }

    // Call the Firebase Callable Function
    // Callable functions require a specific protocol when called via HTTP
    // We need to use the callable function endpoint with proper format
    const functionUrl = `https://us-central1-esim-f0e3e.cloudfunctions.net/sync_packages`;
    
    // Callable functions expect the request in a specific format
    // The SDK normally handles this, but we need to replicate it
    const callableRequest = {
      data: {}
    };
    
    // Call the function using the callable protocol
    // Note: Callable functions use a special endpoint format
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        // Callable functions may need additional headers
        'X-Goog-Api-Key': process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''
      },
      body: JSON.stringify(callableRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Try to parse as JSON if possible
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch (e) {
        // Not JSON, use as-is
      }
      throw new Error(`Firebase function error: ${response.status} - ${errorMessage}`);
    }

    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Unexpected response format: ${text}`);
    }
    
    // Callable functions return: { result: {...} } when called via SDK
    // When called via HTTP directly, the format may vary
    const actualResult = result.result || result.data || result;

    return NextResponse.json(
      actualResult,
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Error calling sync_packages function:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync packages',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

