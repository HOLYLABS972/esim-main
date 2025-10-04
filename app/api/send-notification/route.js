import { NextResponse } from 'next/server';

// For development/testing, we'll use the FCM REST API directly
// In production, you should use Firebase Admin SDK with proper service account credentials
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY; // You'll need to set this
const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

export async function POST(request) {
  try {
    const requestBody = await request.json();
    const { 
      title, 
      body: messageBody, 
      tokens = [], // Array of FCM tokens
      topic, // Optional: send to topic instead of specific tokens
      data = {}, // Optional: custom data payload
      imageUrl // Optional: notification image
    } = requestBody;

    // Validation
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    if (!tokens.length && !topic) {
      return NextResponse.json(
        { error: 'Either tokens or topic is required' },
        { status: 400 }
      );
    }

    // For now, we'll return a mock success response since FCM_SERVER_KEY is not set
    // In production, you need to set up proper Firebase Admin SDK credentials
    if (!FCM_SERVER_KEY) {
      console.log('⚠️ FCM_SERVER_KEY not set, returning mock response');
      console.log('📱 Would send notification:', { title, body: messageBody, tokens: tokens.length });
      console.log('🔧 To enable real notifications:');
      console.log('1. Go to Firebase Console → Project Settings → Cloud Messaging');
      console.log('2. Copy the Server Key');
      console.log('3. Set environment variable: FCM_SERVER_KEY=your_server_key');
      console.log('4. Or use Firebase Admin SDK with service account credentials');
      
      return NextResponse.json({
        success: true,
        messageId: 'mock-message-id',
        sentCount: tokens.length,
        successCount: tokens.length,
        failureCount: 0,
        note: 'Mock response - FCM_SERVER_KEY not configured. Check server logs for setup instructions.'
      });
    }

    // Build notification payload for FCM REST API
    const payload = {
      notification: {
        title,
        body: messageBody,
        ...(imageUrl && { image: imageUrl })
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
        source: 'dashboard'
      }
    };

    let successCount = 0;
    let failureCount = 0;
    const responses = [];

    if (topic) {
      // Send to topic
      const response = await fetch(FCM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `key=${FCM_SERVER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          to: `/topics/${topic}`
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success === 1) {
        successCount = 1;
        console.log('✅ FCM notification sent to topic:', topic);
      } else {
        failureCount = 1;
        console.error('❌ FCM topic notification failed:', result);
      }
    } else {
      // Send to specific tokens (batch processing)
      for (const token of tokens) {
        try {
          const response = await fetch(FCM_ENDPOINT, {
            method: 'POST',
            headers: {
              'Authorization': `key=${FCM_SERVER_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...payload,
              to: token
            }),
          });

          const result = await response.json();
          
          if (response.ok && result.success === 1) {
            successCount++;
          } else {
            failureCount++;
            console.error('❌ FCM token notification failed:', result);
          }
          
          responses.push(result);
        } catch (error) {
          failureCount++;
          console.error('❌ FCM token notification error:', error);
        }
      }
      
      console.log(`✅ FCM notification sent to ${successCount}/${tokens.length} devices`);
    }

    return NextResponse.json({
      success: true,
      messageId: responses[0]?.message_id || 'batch-send',
      sentCount: tokens.length,
      successCount,
      failureCount
    });

  } catch (error) {
    console.error('❌ FCM notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification from web', details: error.message },
      { status: 500 }
    );
  }
}
