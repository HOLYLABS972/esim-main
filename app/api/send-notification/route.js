import { NextResponse } from 'next/server';

// FCM push notifications removed (Firebase-specific). Stubbed out.
export async function POST(request) {
  return NextResponse.json({
    success: true,
    message: 'Push notifications are not available (Firebase FCM removed)',
    successCount: 0,
    failureCount: 0,
  });
}
