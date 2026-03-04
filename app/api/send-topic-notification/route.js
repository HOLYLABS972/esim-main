import { NextResponse } from 'next/server';

// FCM topic notifications removed (Firebase-specific). Stubbed out.
export async function POST(request) {
  return NextResponse.json({
    success: true,
    message: 'Topic notifications are not available (Firebase FCM removed)',
  });
}
