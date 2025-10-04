import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let credential;
    
    // Try to use environment variables first (production)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: 'esim-f0e3e',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
      console.log('✅ Firebase Admin SDK initialized with environment variables');
    } 
    // Fallback to service account file (development only)
    else {
      credential = admin.credential.cert('./esim-service.json');
      console.log('✅ Firebase Admin SDK initialized with service account file (dev mode)');
    }

    admin.initializeApp({
      credential,
      projectId: 'esim-f0e3e',
    });
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
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

    console.log('📨 Received notification request:', {
      title,
      body: messageBody,
      tokensCount: tokens.length,
      topic,
      hasImageUrl: !!imageUrl
    });

    // Validation
    if (!title || !messageBody) {
      console.error('❌ Validation failed: Title and body are required');
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    if (!tokens.length && !topic) {
      console.error('❌ Validation failed: Either tokens or topic is required');
      return NextResponse.json(
        { error: 'Either tokens or topic is required' },
        { status: 400 }
      );
    }

    // Build notification payload using Firebase Admin SDK V1 API
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

    console.log('📝 Built message payload:', JSON.stringify(message, null, 2));

    let response;
    const messaging = admin.messaging();

    if (topic) {
      // Send to topic using V1 API
      message.topic = topic;
      console.log('📡 Sending to topic:', topic);
      response = await messaging.send(message);
      console.log('✅ FCM notification sent to topic:', topic, 'Response:', response);
    } else {
      // Send to specific tokens using individual sends (more reliable than sendMulticast)
      console.log('📱 Sending to', tokens.length, 'tokens individually...');
      
      const results = [];
      let successCount = 0;
      let failureCount = 0;
      const failedTokens = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        try {
          console.log(`📤 Sending to token ${i + 1}/${tokens.length}:`, token.substring(0, 20) + '...');
          
          const individualMessage = {
            ...message,
            token: token
          };
          
          const result = await messaging.send(individualMessage);
          results.push({ success: true, messageId: result });
          successCount++;
          console.log(`✅ Success for token ${i + 1}:`, result);
        } catch (error) {
          console.error(`❌ Failed for token ${i + 1}:`, error.message);
          results.push({ success: false, error: error.message });
          failedTokens.push(token);
          failureCount++;
        }
      }

      response = {
        results,
        successCount,
        failureCount,
        failedTokens
      };
      
      console.log(`📊 Final results: ${successCount}/${tokens.length} successful`);
      if (failureCount > 0) {
        console.log('❌ Failed tokens:', failedTokens.map(token => token.substring(0, 20) + '...'));
      }
    }

    const finalResponse = {
      success: true,
      messageId: response.messageId || 'multiple',
      sentCount: tokens.length,
      successCount: response.successCount || 1,
      failureCount: response.failureCount || 0,
      details: response
    };

    console.log('🎉 Notification sending completed:', finalResponse);

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('❌ FCM notification error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to send notification from web', details: error.message },
      { status: 500 }
    );
  }
}
