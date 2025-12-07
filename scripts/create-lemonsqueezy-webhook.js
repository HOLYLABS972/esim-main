/**
 * Script to create a Lemon Squeezy webhook programmatically
 * 
 * Usage:
 *   node scripts/create-lemonsqueezy-webhook.js
 * 
 * Or with environment variables:
 *   LEMON_SQUEEZY_API_KEY=your_key LEMON_SQUEEZY_STORE_ID=your_store_id node scripts/create-lemonsqueezy-webhook.js
 */

const https = require('https');

// Configuration - Update these values
const CONFIG = {
  apiKey: process.env.LEMON_SQUEEZY_API_KEY || 'YOUR_API_KEY_HERE',
  storeId: process.env.LEMON_SQUEEZY_STORE_ID || 'YOUR_STORE_ID_HERE',
  webhookUrl: process.env.WEBHOOK_URL || 'https://yourdomain.com/api/webhooks/lemonsqueezy',
  webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || 'e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c',
  events: [
    'order_created',
    'order_paid',
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled'
  ]
};

function createWebhook() {
  return new Promise((resolve, reject) => {
    // Validate configuration
    if (CONFIG.apiKey === 'YOUR_API_KEY_HERE' || !CONFIG.apiKey) {
      reject(new Error('❌ LEMON_SQUEEZY_API_KEY is required. Set it as an environment variable or update the script.'));
      return;
    }

    if (CONFIG.storeId === 'YOUR_STORE_ID_HERE' || !CONFIG.storeId) {
      reject(new Error('❌ LEMON_SQUEEZY_STORE_ID is required. Set it as an environment variable or update the script.'));
      return;
    }

    if (CONFIG.webhookUrl.includes('yourdomain.com')) {
      reject(new Error('❌ WEBHOOK_URL must be updated. Set it as an environment variable or update the script.'));
      return;
    }

    const payload = JSON.stringify({
      data: {
        type: 'webhooks',
        attributes: {
          url: CONFIG.webhookUrl,
          events: CONFIG.events,
          secret: CONFIG.webhookSecret
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: CONFIG.storeId
            }
          }
        }
      }
    });

    console.log('🔄 Creating Lemon Squeezy webhook...');
    console.log('📋 Configuration:');
    console.log('   Store ID:', CONFIG.storeId);
    console.log('   Webhook URL:', CONFIG.webhookUrl);
    console.log('   Events:', CONFIG.events.join(', '));
    console.log('   Secret:', CONFIG.webhookSecret.substring(0, 20) + '...');

    const options = {
      hostname: 'api.lemonsqueezy.com',
      port: 443,
      path: '/v1/webhooks',
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Webhook created successfully!');
            console.log('📦 Webhook ID:', response.data.id);
            console.log('🔗 Webhook URL:', response.data.attributes.url);
            console.log('📋 Events:', response.data.attributes.events.join(', '));
            console.log('\n💡 Next steps:');
            console.log('   1. Make sure the same webhook secret is in your Firestore config:');
            console.log('      Collection: config');
            console.log('      Document: lemonsqueezy');
            console.log('      Field: webhook_secret');
            console.log('   2. Test the webhook by creating a test order');
            resolve(response);
          } else {
            console.error('❌ Failed to create webhook');
            console.error('Status:', res.statusCode);
            console.error('Response:', data);
            reject(new Error(`API Error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Run the script
if (require.main === module) {
  createWebhook()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { createWebhook, CONFIG };
