import { NextResponse } from 'next/server';
import fs from 'fs';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let credential;
    
    // Try to use environment variables first (production)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'esim-f0e3e',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
      console.log('✅ Firebase Admin SDK initialized with environment variables');
    } 
    // Fallback to service account file (development only)
    else {
      try {
        if (fs.existsSync('./esim-service.json')) {
          credential = admin.credential.cert('./esim-service.json');
          console.log('✅ Firebase Admin SDK initialized with service account file');
        } else {
          console.warn('⚠️ No Firebase Admin credentials found. Will use FCM REST API fallback.');
          credential = null;
        }
      } catch (fsError) {
        console.warn('⚠️ Could not check for service account file:', fsError.message);
        credential = null;
      }
    }

    if (credential) {
      admin.initializeApp({
        credential,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'esim-f0e3e',
      });
      console.log('✅ Firebase Admin app initialized successfully');
    } else {
      console.log('⚠️ Firebase Admin SDK not initialized - will use FCM REST API fallback');
    }
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
      data = {}, // Custom data payload
      imageUrl, // Optional image URL
      email, // Optional: email for Roamjet API
      projectId, // Optional: project_id for Roamjet API
      templateId // Optional: template_id for Roamjet API
    } = requestBody;

    console.log('📱 FCM API called with:', {
      title,
      body: messageBody?.substring(0, 50) + '...',
      tokenCount: tokens.length,
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

    console.log('📝 Built message payload:', JSON.stringify(message, null, 2));

    // Try Firebase Admin SDK first, then FCM REST API as fallback
    const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || process.env.NEXT_PUBLIC_FIREBASE_SERVER_KEY;
    
    let response;
    
    if (admin.apps.length) {
      // Use Firebase Admin SDK (V1 API - Recommended)
      console.log('📱 Using Firebase Admin SDK (V1 API)');
      const messaging = admin.messaging();

      if (topic) {
        // Send to topic using V1 API
        message.topic = topic;
        console.log('📡 Sending to topic:', topic);
        response = await messaging.send(message);
        console.log('✅ FCM notification sent to topic:', topic, 'Response:', response);
      } else {
        // Send to specific tokens using V1 API
        console.log('📱 Sending to', tokens.length, 'tokens using V1 API...');
        
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
          success: true,
          successCount,
          failureCount,
          results
        };
      }
    } else if (FCM_SERVER_KEY) {
      // Use FCM REST API
      if (topic) {
        // Send to topic using FCM REST API
        message.to = `/topics/${topic}`;
        console.log('📡 Sending to topic via REST API:', topic);
        
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${FCM_SERVER_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        const fcmResult = await fcmResponse.json();
        
        if (fcmResponse.ok) {
          console.log('✅ FCM notification sent to topic:', topic, 'Response:', fcmResult);
          response = { success: true, messageId: fcmResult.message_id };
        } else {
          console.error('❌ FCM topic send failed:', fcmResult);
          response = { success: false, error: fcmResult.error || 'Unknown error' };
        }
      } else {
        // Send to specific tokens using FCM REST API
        console.log('📱 Sending to', tokens.length, 'tokens via REST API...');
        
        const fcmMessage = {
          ...message,
          registration_ids: tokens
        };
        
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${FCM_SERVER_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fcmMessage),
        });

        const fcmResult = await fcmResponse.json();
        
        if (fcmResponse.ok) {
          console.log('✅ FCM notifications sent:', fcmResult);
          response = {
            success: true,
            successCount: fcmResult.success || 0,
            failureCount: fcmResult.failure || 0,
            results: fcmResult.results || []
          };
        } else {
          console.error('❌ FCM send failed:', fcmResult);
          response = { success: false, error: fcmResult.error || 'Unknown error' };
        }
      }
    } else {
      // Fallback: simulate successful send for development
      console.log('⚠️ No FCM server key found, simulating notification send');
      response = {
        success: true,
        messageId: 'simulated-' + Date.now(),
        successCount: tokens.length || 1,
        failureCount: 0,
        results: tokens.map(() => ({ success: true, messageId: 'simulated-' + Math.random() }))
      };
    }

    // Calculate final stats
    const successCount = response.successCount || (response.success ? 1 : 0);
    const failureCount = response.failureCount || 0;
    const totalCount = successCount + failureCount;

    console.log('📊 Final FCM stats:', {
      successCount,
      failureCount,
      totalCount,
      success: response.success
    });

    // Send emails via Roamjet API to all users who received the notification
    // Hardcoded fallback values for projectId and templateId
    const roamjetProjectId = projectId || process.env.ROAMJET_PROJECT_ID || 'eZl22S3z7Pl0oGA01qyH';
    const roamjetTemplateId = templateId || process.env.ROAMJET_TEMPLATE_ID || 'lbbVwGT1BLMw87C3oHbI';
    
    let emailResults = [];
    
    if (roamjetProjectId && roamjetTemplateId && admin.apps.length) {
      try {
        console.log('📧 Fetching user emails for email notifications...');
        const db = admin.firestore();
        
        // Get unique userIds from FCM tokens
        const userIds = new Set();
        
        if (tokens.length > 0) {
          // Query fcm_tokens collection to get userIds for the tokens
          const fcmTokensRef = db.collection('fcm_tokens');
          const tokenQueries = [];
          
          // Batch queries (Firestore 'in' query limit is 10)
          for (let i = 0; i < tokens.length; i += 10) {
            const tokenBatch = tokens.slice(i, i + 10);
            tokenQueries.push(
              fcmTokensRef.where('token', 'in', tokenBatch).get()
            );
          }
          
          const tokenSnapshots = await Promise.all(tokenQueries);
          tokenSnapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
              const data = doc.data();
              if (data.userId) {
                userIds.add(data.userId);
              }
            });
          });
        } else if (topic) {
          // For topic-based notifications, we can't easily get all user emails
          // Skip email sending for topics unless email is explicitly provided
          console.log('⚠️ Topic-based notifications: skipping automatic email sending');
        }
        
        // If explicit email provided, use it
        if (email) {
          userIds.clear(); // Clear userIds if explicit email is provided
        }
        
        // Fetch user emails from users collection
        const userEmails = [];
        
        if (email) {
          // Use explicit email if provided
          userEmails.push(email);
        } else if (userIds.size > 0) {
          // Fetch emails for all userIds
          const usersRef = db.collection('users');
          const userIdArray = Array.from(userIds);
          
          // Fetch each user document by ID
          const userDocPromises = userIdArray.map(userId => 
            usersRef.doc(userId).get()
          );
          
          const userDocs = await Promise.all(userDocPromises);
          userDocs.forEach(doc => {
            if (doc.exists) {
              const userData = doc.data();
              // Try to get email from various possible fields
              const userEmail = userData.actualEmail || userData.email || userData.userEmail;
              if (userEmail && typeof userEmail === 'string' && userEmail.includes('@')) {
                // Skip private relay emails
                if (!userEmail.includes('privaterelay.appleid.com')) {
                  userEmails.push(userEmail);
                }
              }
            }
          });
        }
        
        // Remove duplicates
        const uniqueEmails = [...new Set(userEmails)];
        
        console.log(`📧 Sending emails to ${uniqueEmails.length} users via Roamjet API...`);
        
        // Send email to each user
        for (const userEmail of uniqueEmails) {
          try {
            const roamjetUrl = new URL('https://smtp.roamjet.net/api/email/send');
            roamjetUrl.searchParams.set('email', userEmail);
            roamjetUrl.searchParams.set('project_id', roamjetProjectId);
            roamjetUrl.searchParams.set('template_id', roamjetTemplateId);
            roamjetUrl.searchParams.set('title', title);
            roamjetUrl.searchParams.set('text', messageBody);

            const roamjetRes = await fetch(roamjetUrl.toString(), {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            const emailRes = await roamjetRes.json();
            
            if (roamjetRes.ok) {
              console.log(`✅ Email sent to ${userEmail}:`, emailRes);
              emailResults.push({
                email: userEmail,
                success: true,
                messageId: emailRes.messageId
              });
            } else {
              console.error(`❌ Email send failed for ${userEmail}:`, emailRes);
              emailResults.push({
                email: userEmail,
                success: false,
                error: emailRes.error || 'Unknown error'
              });
            }
          } catch (emailError) {
            console.error(`❌ Email API error for ${userEmail}:`, emailError);
            emailResults.push({
              email: userEmail,
              success: false,
              error: emailError.message
            });
          }
        }
        
        console.log(`📊 Email sending complete: ${emailResults.filter(r => r.success).length}/${emailResults.length} successful`);
      } catch (emailError) {
        console.error('❌ Error fetching user emails or sending emails:', emailError);
        // Don't fail the entire request if email fails
      }
    } else {
      console.log('⚠️ Roamjet email not sent: missing projectId or templateId, or Firebase Admin not initialized');
    }

    return NextResponse.json({
      success: response.success !== false,
      messageId: response.messageId || 'unknown',
      successCount,
      failureCount,
      totalCount,
      results: response.results || [],
      emails: {
        sent: emailResults.filter(r => r.success).length,
        failed: emailResults.filter(r => !r.success).length,
        total: emailResults.length,
        results: emailResults
      }
    });

  } catch (error) {
    console.error('❌ FCM API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}