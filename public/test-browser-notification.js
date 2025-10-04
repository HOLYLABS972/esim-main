// Browser-like test for notification sending
// This simulates what the web dashboard should be doing

async function testBrowserLikeRequest() {
  console.log('🌐 Testing browser-like notification request...');
  
  try {
    // Step 1: Get FCM tokens (like the web dashboard does)
    console.log('1️⃣ Fetching FCM tokens...');
    const tokensResponse = await fetch('/api/fcm-tokens');
    
    if (!tokensResponse.ok) {
      throw new Error(`FCM tokens fetch failed: ${tokensResponse.status} ${tokensResponse.statusText}`);
    }
    
    const tokensData = await tokensResponse.json();
    console.log('✅ FCM tokens retrieved:', {
      success: tokensData.success,
      count: tokensData.tokens?.length || 0
    });
    
    if (!tokensData.success || !tokensData.tokens?.length) {
      throw new Error('No FCM tokens available');
    }
    
    const tokens = tokensData.tokens.map(token => token.token);
    
    // Step 2: Send notification (like the web dashboard does)
    console.log('2️⃣ Sending notification...');
    const notificationData = {
      title: 'Browser Test Notification',
      body: 'Testing from browser-like environment',
      tokens: tokens,
      data: {
        type: 'browser_test',
        timestamp: Date.now().toString(),
        sentFrom: 'dashboard'
      }
    };
    
    console.log('📤 Sending notification with data:', {
      title: notificationData.title,
      tokensCount: notificationData.tokens.length,
      hasData: Object.keys(notificationData.data).length > 0
    });
    
    const notificationResponse = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    });
    
    console.log('📨 Notification response status:', notificationResponse.status);
    console.log('📨 Notification response ok:', notificationResponse.ok);
    
    if (!notificationResponse.ok) {
      const errorText = await notificationResponse.text();
      throw new Error(`Notification send failed: ${notificationResponse.status} ${notificationResponse.statusText} - ${errorText}`);
    }
    
    const result = await notificationResponse.json();
    console.log('✅ Notification sent successfully:', {
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
      messageId: result.messageId
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Browser-like test failed:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
}

// Test if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
  testBrowserLikeRequest()
    .then(result => {
      console.log('🎉 Browser test completed successfully!', result);
    })
    .catch(error => {
      console.error('💥 Browser test failed:', error);
    });
} else {
  console.log('📦 Running in Node.js environment - browser test skipped');
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testBrowserLikeRequest };
}
