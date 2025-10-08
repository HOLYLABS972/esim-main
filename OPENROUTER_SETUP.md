# Quick OpenRouter Setup for Config Tab

## Step-by-Step Setup

### 1. Get Your OpenRouter API Key

1. Go to **https://openrouter.ai/keys**
2. Sign in with Google (or create account)
3. Click **"Create Key"**
4. Copy the key (starts with `sk-or-v1-...`)

### 2. Add to Firestore Config Tab

In your admin panel, go to the **Config** section and add:

**Collection:** `config`  
**Document ID:** `openrouter`

**Fields:**
```javascript
{
  api_key: "sk-or-v1-YOUR-KEY-HERE",
  model: "openai/gpt-3.5-turbo",
  max_tokens: 150,
  temperature: 0.7,
  site_name: "RoamJet",
  site_url: "https://roamjet.com"
}
```

### 3. Choose Your Model

Edit the `model` field to use different AI models:

**Recommended for Daily Notifications:**
```javascript
// Fast & Cheap
model: "openai/gpt-3.5-turbo"          // $0.002/1K tokens
model: "google/gemini-flash-1.5"       // $0.001/1K tokens
model: "meta-llama/llama-3.1-8b-instruct:free"  // FREE!

// High Quality
model: "openai/gpt-4-turbo"            // $0.01/1K tokens
model: "anthropic/claude-3.5-sonnet"   // $0.015/1K tokens
```

### 4. Test It

Send a test notification:

```javascript
fetch('/api/ai-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Test Notification",
    prompt: "Create a friendly travel tip about eSIM",
    testMode: true  // Won't send, just generates
  })
})
.then(res => res.json())
.then(data => console.log('Generated:', data.generated.body));
```

## Firestore Document Example

Here's what your Firestore document should look like:

```
config/
  openrouter/
    ├── api_key: "sk-or-v1-1234567890abcdef..."
    ├── model: "openai/gpt-3.5-turbo"
    ├── max_tokens: 150
    ├── temperature: 0.7
    ├── site_name: "RoamJet"
    └── site_url: "https://roamjet.com"
```

## Configuration Fields Explained

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `api_key` | string | Your OpenRouter API key | `sk-or-v1-...` |
| `model` | string | AI model to use | `openai/gpt-3.5-turbo` |
| `max_tokens` | number | Max response length | `150` |
| `temperature` | number | Creativity (0-2) | `0.7` |
| `site_name` | string | Your app name | `RoamJet` |
| `site_url` | string | Your website | `https://roamjet.com` |

## Model Recommendations

### For Daily Notifications (Choose One)

**Best Value:**
```javascript
model: "google/gemini-flash-1.5"
// Fast, cheap, good quality
// Cost: ~$0.10/month for 1000 users
```

**Free Option:**
```javascript
model: "meta-llama/llama-3.1-8b-instruct:free"
// Completely free
// Good quality for simple notifications
```

**Most Reliable:**
```javascript
model: "openai/gpt-3.5-turbo"
// Industry standard
// Cost: ~$0.20/month for 1000 users
```

**Best Quality:**
```javascript
model: "anthropic/claude-3.5-sonnet"
// Excellent at creative writing
// Cost: ~$1.50/month for 1000 users
```

## Adding Spending Limits (Recommended)

1. Go to https://openrouter.ai/settings/limits
2. Set a monthly limit (e.g., $5/month)
3. This prevents unexpected charges

## Testing Your Configuration

### Test 1: Check Config Loads
```javascript
import { configService } from './src/services/configService';

const config = await configService.getOpenRouterConfig();
console.log('Config loaded:', config.apiKey ? 'Yes' : 'No');
console.log('Model:', config.model);
```

### Test 2: Generate Content (No Send)
```bash
curl -X POST http://localhost:3000/api/ai-notification \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a short travel tip about eSIM",
    "testMode": true
  }'
```

### Test 3: Send to Yourself
```bash
curl -X POST http://localhost:3000/api/ai-notification \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "prompt": "Create a friendly greeting",
    "userIds": ["your-user-id-here"]
  }'
```

## Troubleshooting

### "OpenRouter API key not configured"
✅ Check Firestore: `config/openrouter/api_key` exists  
✅ Check key starts with `sk-or-v1-`  
✅ Restart your Next.js server

### "No active FCM tokens found"
✅ Users must have the mobile app installed  
✅ Users must grant notification permission  
✅ Check `fcm_tokens` collection in Firestore

### API key not working
✅ Verify at https://openrouter.ai/keys  
✅ Check if key is active  
✅ Add credits to your OpenRouter account  
✅ Check spending limits

## Next Steps

1. ✅ Add OpenRouter config to Firestore
2. ✅ Test with `testMode: true`
3. ✅ Try different models
4. ✅ Set up daily automated notifications
5. ✅ Monitor usage and costs

## Support

- OpenRouter Docs: https://openrouter.ai/docs
- Model List: https://openrouter.ai/models
- Usage Dashboard: https://openrouter.ai/activity
- Support: https://openrouter.ai/support

