import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { collection, query, getDocs, where, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../src/firebase/config';

// Initialize Firebase Admin SDK (same as send-notification)
if (!admin.apps.length) {
  try {
    let credential;
    
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'esim-f0e3e',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
      console.log('✅ Firebase Admin SDK initialized');
    } else {
      try {
        const fs = require('fs');
        if (fs.existsSync('./esim-service.json')) {
          credential = admin.credential.cert('./esim-service.json');
        }
      } catch (fsError) {
        console.warn('⚠️ No Firebase Admin credentials found');
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

/**
 * Generate notification content using OpenRouter AI with language support
 */
async function generateNotificationWithAI(prompt, countryCode, countryName, language, config) {
  try {
    // Language-specific system prompts
    const languagePrompts = {
      'en': 'You are a helpful assistant that creates engaging, concise notification messages for a travel eSIM service called RoamJet. Keep messages under 120 characters, friendly, and actionable.',
      'fr': 'Vous êtes un assistant qui crée des messages de notification engageants et concis pour un service eSIM de voyage appelé RoamJet. Gardez les messages sous 120 caractères, amicaux et actionnables.',
      'es': 'Eres un asistente que crea mensajes de notificación atractivos y concisos para un servicio eSIM de viajes llamado RoamJet. Mantén los mensajes bajo 120 caracteres, amigables y accionables.',
      'de': 'Sie sind ein Assistent, der ansprechende, prägnante Benachrichtigungsnachrichten für einen Reise-eSIM-Service namens RoamJet erstellt. Halten Sie Nachrichten unter 120 Zeichen, freundlich und umsetzbar.',
      'it': 'Sei un assistente che crea messaggi di notifica coinvolgenti e concisi per un servizio eSIM di viaggio chiamato RoamJet. Mantieni i messaggi sotto i 120 caratteri, amichevoli e azionabili.',
      'pt': 'Você é um assistente que cria mensagens de notificação envolventes e concisas para um serviço eSIM de viagem chamado RoamJet. Mantenha as mensagens com menos de 120 caracteres, amigáveis e acionáveis.',
      'ru': 'Вы помощник, который создает увлекательные и лаконичные уведомления для туристического eSIM-сервиса RoamJet. Сообщения должны быть до 120 символов, дружелюбными и действенными.',
      'he': 'אתה עוזר שיוצר הודעות התראה מעניינות ותמציתיות לשירות eSIM לנסיעות בשם RoamJet. שמור על הודעות מתחת ל-120 תווים, ידידותיות וניתנות לפעולה.',
      'ar': 'أنت مساعد ينشئ رسائل إشعارات جذابة وموجزة لخدمة eSIM للسفر تسمى RoamJet. حافظ على الرسائل أقل من 120 حرفًا، وودية وقابلة للتنفيذ.',
      'zh': '您是一个助手，为名为RoamJet的旅行eSIM服务创建引人入胜、简洁的通知消息。保持消息在120个字符以内，友好且可操作。',
      'ja': 'あなたは、RoamJetという旅行eSIMサービスの魅力的で簡潔な通知メッセージを作成するアシスタントです。メッセージは120文字以内で、親しみやすく実行可能にしてください。',
      'ko': '당신은 RoamJet라는 여행 eSIM 서비스를 위한 매력적이고 간결한 알림 메시지를 만드는 어시스턴트입니다. 메시지는 120자 이하로, 친근하고 실행 가능하게 유지하세요.',
      'hi': 'आप एक सहायक हैं जो RoamJet नामक यात्रा eSIM सेवा के लिए आकर्षक, संक्षिप्त अधिसूचना संदेश बनाता है। संदेश 120 वर्णों से कम, मैत्रीपूर्ण और कार्रवाई योग्य रखें।',
      'tr': 'RoamJet adlı bir seyahat eSIM hizmeti için ilgi çekici, özlü bildirim mesajları oluşturan bir asistanısınız. Mesajları 120 karakterin altında, dostane ve eyleme geçirilebilir tutun.'
    };

    const systemPrompt = languagePrompts[language] || languagePrompts['en'];
    
    // Build user prompt with country context
    const userPrompt = countryCode && countryName
      ? `${prompt} Focus on ${countryName} (${countryCode}). Respond in ${language.toUpperCase()} language.`
      : `${prompt} Respond in ${language.toUpperCase()} language.`;

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': config.siteUrl,
        'X-Title': config.siteName
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('No content generated from AI');
    }

    // Clean up the content
    const cleanedContent = content
      .replace(/^["']|["']$/g, '')
      .replace(/\[|\]/g, '')
      .replace(/\(|\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedContent;
  } catch (error) {
    console.error('❌ Error generating AI content:', error);
    throw error;
  }
}

/**
 * POST /api/send-topic-notification
 * Send notification to FCM topic (country-based) with language support
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      prompt, // AI prompt for generating notification
      countryCode, // e.g., 'FR', 'US'
      countryName, // e.g., 'France', 'United States'
      topic, // Optional: override topic (defaults to country_XX)
      languages = ['en'], // Array of languages to send in
      imageUrl,
      aiConfig,
      saveOnly = false
    } = body;

    console.log('📱 Topic notification API called:', {
      title,
      countryCode,
      countryName,
      topic,
      languages
    });

    // Validation
    if (!title && !prompt) {
      return NextResponse.json(
        { error: 'Either title or prompt is required' },
        { status: 400 }
      );
    }

    if (!countryCode && !topic) {
      return NextResponse.json(
        { error: 'Either countryCode or topic is required' },
        { status: 400 }
      );
    }

    // Determine topic
    const notificationTopic = topic || `country_${countryCode.toUpperCase()}`;

    // Get OpenRouter config
    let config = aiConfig;
    if (!config || !config.apiKey) {
      try {
        const openRouterConfigRef = doc(db, 'config', 'openrouter');
        const openRouterConfigDoc = await getDoc(openRouterConfigRef);
        
        if (openRouterConfigDoc.exists()) {
          const configData = openRouterConfigDoc.data();
          if (configData.api_key) {
            config = {
              apiKey: configData.api_key,
              model: configData.model || 'openai/gpt-3.5-turbo',
              baseUrl: 'https://openrouter.ai/api/v1',
              maxTokens: configData.max_tokens || 150,
              temperature: configData.temperature || 0.7,
              siteName: configData.site_name || 'RoamJet',
              siteUrl: configData.site_url || 'https://esim.roamjet.net'
            };
          }
        }
      } catch (firestoreError) {
        console.error('⚠️ Could not load from Firestore:', firestoreError.message);
      }
      
      if (!config || !config.apiKey) {
        config = {
          apiKey: process.env.OPENROUTER_API_KEY,
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
          baseUrl: 'https://openrouter.ai/api/v1',
          maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 150,
          temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7,
          siteName: process.env.OPENROUTER_SITE_NAME || 'RoamJet',
          siteUrl: process.env.OPENROUTER_SITE_URL || 'https://esim.roamjet.net'
        };
      }
    }

    if (!config.apiKey && prompt) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured for AI generation' },
        { status: 500 }
      );
    }

    // Generate notifications for each language
    const notifications = {};
    const results = [];

    for (const language of languages) {
      try {
        let notificationTitle = title;
        let notificationBody = prompt;

        // If prompt provided, generate AI content
        if (prompt && config.apiKey) {
          console.log(`🤖 Generating ${language} notification for ${countryName || countryCode}...`);
          notificationBody = await generateNotificationWithAI(
            prompt,
            countryCode,
            countryName,
            language,
            config
          );
          
          // Generate title if not provided
          if (!notificationTitle) {
            notificationTitle = countryName 
              ? `RoamJet - ${countryName}`
              : 'RoamJet Update';
          }
        }

        notifications[language] = {
          title: notificationTitle,
          body: notificationBody
        };

        console.log(`✅ Generated ${language} notification:`, notifications[language]);
      } catch (error) {
        console.error(`❌ Error generating ${language} notification:`, error);
        // Continue with other languages
      }
    }

    // If save only, return without sending
    if (saveOnly) {
      return NextResponse.json({
        success: true,
        saveOnly: true,
        topic: notificationTopic,
        notifications,
        message: 'Notifications generated and ready to send'
      });
    }

    // Check Firebase Admin SDK
    if (!admin.apps.length) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not initialized',
        notifications
      }, { status: 500 });
    }

    // Send notifications to topic
    const messaging = admin.messaging();
    const sendResults = [];

    // For now, send in English (or first language) to the topic
    // In the future, we can filter users by language and send to specific tokens
    const primaryLanguage = languages[0] || 'en';
    const primaryNotification = notifications[primaryLanguage] || notifications['en'];

    if (!primaryNotification) {
      return NextResponse.json({
        success: false,
        error: 'No notification content generated'
      }, { status: 400 });
    }

    try {
      const message = {
        notification: {
          title: primaryNotification.title,
          body: primaryNotification.body,
          ...(imageUrl && { imageUrl })
        },
        data: {
          type: 'country_notification',
          countryCode: countryCode || '',
          countryName: countryName || '',
          topic: notificationTopic,
          language: primaryLanguage,
          timestamp: Date.now().toString()
        },
        topic: notificationTopic,
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
                title: primaryNotification.title,
                body: primaryNotification.body
              },
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      console.log(`📤 Sending notification to topic: ${notificationTopic}`);
      const result = await messaging.send(message);
      console.log(`✅ Successfully sent to topic. Message ID:`, result);

      sendResults.push({
        language: primaryLanguage,
        topic: notificationTopic,
        success: true,
        messageId: result
      });
    } catch (error) {
      console.error(`❌ Error sending to topic:`, error);
      sendResults.push({
        language: primaryLanguage,
        topic: notificationTopic,
        success: false,
        error: error.message
      });
    }

    // Save to database
    try {
      const notificationData = {
        title: primaryNotification.title,
        body: primaryNotification.body,
        type: 'country_topic_notification',
        imageUrl: imageUrl || '',
        targetAudience: notificationTopic,
        countryCode: countryCode || '',
        countryName: countryName || '',
        languages: languages,
        languageNotifications: notifications,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'admin_dashboard',
        isActive: true,
        metadata: {
          topic: notificationTopic,
          prompt: prompt || '',
          aiGenerated: !!prompt,
          generationTimestamp: Date.now()
        }
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      console.log('✅ Saved notification to database');
    } catch (dbError) {
      console.error('❌ Failed to save notification:', dbError);
    }

    return NextResponse.json({
      success: true,
      topic: notificationTopic,
      notifications,
      sendResults,
      message: `Notification sent to topic: ${notificationTopic}`
    });

  } catch (error) {
    console.error('❌ Topic notification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send topic notification',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

