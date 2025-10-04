import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'esim-f0e3e',
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

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

    // Build notification payload
    const message = {
      notification: {
        title,
        body: messageBody,
        ...(imageUrl && { imageUrl })
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
        source: 'dashboard'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'fcm_notifications',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body: messageBody
            },
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    let response;

    if (topic) {
      // Send to topic
      message.topic = topic;
      response = await admin.messaging().send(message);
      console.log('✅ FCM notification sent to topic:', topic);
    } else {
      // Send to specific tokens
      const messaging = admin.messaging();
      
      // Send to all tokens
      response = await messaging.sendMulticast({
        ...message,
        tokens
      });
      
      console.log(`✅ FCM notification sent to ${response.successCount}/${tokens.length} devices`);
      
      if (response.failureCount > 0) {
        console.log('❌ Failed tokens:', response.responses
          .map((resp, idx) => resp.success ? null : tokens[idx])
          .filter(Boolean)
        );
      }
    }

    return NextResponse.json({
      success: true,
      messageId: response,
      sentCount: tokens.length,
      successCount: response.successCount || 1,
      failureCount: response.failureCount || 0
    });

  } catch (error) {
    console.error('❌ FCM notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    );
  }
}
