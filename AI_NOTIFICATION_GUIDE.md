# AI-Generated Daily Notifications Guide

This guide explains how to use the AI notification system to send daily FCM notifications with ChatGPT-generated content.

## Setup

### 1. Configure OpenAI API Key

Choose one of these methods:

**Option A: Environment Variables (Recommended)**
```bash
# Add to .env.local
OPENAI_API_KEY="sk-proj-your-key-here"
OPENAI_MODEL="gpt-3.5-turbo"
OPENAI_TEMPERATURE="0.7"
OPENAI_MAX_TOKENS="150"
```

**Option B: Firestore Configuration**
```javascript
// In Firestore: config/openai document
{
  api_key: "sk-proj-your-key-here",
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  max_tokens: 150
}
```

### 2. Get Your OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy the key (starts with `sk-proj-...`)

## API Usage

### Send AI-Generated Notification

**Endpoint:** `POST /api/ai-notification`

**Request Body:**
```javascript
{
  "title": "Travel Tip of the Day",  // Optional, defaults to "RoamJet Update"
  "prompt": "Create a short tip about saving money on international roaming",
  "userIds": [],  // Optional: specific user IDs, empty = all users
  "testMode": false  // Set to true to test without sending
}
```

**Response:**
```javascript
{
  "success": true,
  "generated": {
    "title": "Travel Tip of the Day",
    "body": "💡 Save up to 90% on roaming! Activate your eSIM before you fly and enjoy instant connectivity worldwide. 🌍✈️"
  },
  "sent": {
    "total": 150,
    "success": 148,
    "failed": 2
  }
}
```

### Test AI Generation (Without Sending)

```javascript
{
  "title": "Test Notification",
  "prompt": "Create an exciting message about new country coverage",
  "testMode": true  // Won't send, just generates content
}
```

### Get Example Prompts

**Endpoint:** `GET /api/ai-notification?action=examples`

Returns categorized prompt examples for different use cases.

## Example Implementation

### 1. Simple Test (using fetch)

```javascript
const response = await fetch('/api/ai-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Daily Travel Tip',
    prompt: 'Share a useful tip about using eSIM while traveling',
    testMode: true  // Test first
  })
});

const result = await response.json();
console.log('Generated:', result.generated.body);
```

### 2. Send to All Users

```javascript
const response = await fetch('/api/ai-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: '🌍 Travel Smart Today',
    prompt: 'Create an engaging tip about international data plans, under 100 characters',
    userIds: []  // Empty = all users
  })
});
```

### 3. Send to Specific Users

```javascript
const response = await fetch('/api/ai-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Special Offer',
    prompt: 'Write an exciting message about a limited-time discount',
    userIds: ['user1', 'user2', 'user3']  // Specific users only
  })
});
```

## Prompt Examples

### Travel Tips
```
"Create a notification about saving money on international roaming"
"Share a quick tip about activating eSIM before traveling"
"Write advice about managing data usage abroad"
```

### Promotional
```
"Announce new country coverage with excitement"
"Create a flash sale notification for data plans"
"Write about a weekend special offer"
```

### Engagement
```
"Encourage users to refer friends in a friendly way"
"Remind users to check their data balance"
"Invite users to share travel experiences"
```

### Educational
```
"Explain what eSIM is in simple terms, under 100 characters"
"Share how to check eSIM compatibility"
"Describe one key benefit of eSIM"
```

## Scheduling Daily Notifications

### Option 1: Vercel Cron Jobs

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/daily-notification",
    "schedule": "0 10 * * *"
  }]
}
```

Then create `/app/api/cron/daily-notification/route.js`:
```javascript
export async function GET() {
  const prompts = [
    "Share a travel tip about staying connected abroad",
    "Write about eSIM benefits for travelers",
    "Create a tip about data usage management"
  ];
  
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_URL}/api/ai-notification`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '📱 Daily Travel Tip',
        prompt: randomPrompt
      })
    }
  );
  
  return Response.json(await response.json());
}
```

### Option 2: External Cron Service

Use services like:
- **cron-job.org** (free)
- **EasyCron**
- **GitHub Actions**

Schedule a daily HTTP request to your API:
```bash
curl -X POST https://your-domain.com/api/ai-notification \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Daily Tip",
    "prompt": "Create a travel tip about eSIM"
  }'
```

### Option 3: Firebase Cloud Functions

```javascript
const functions = require('firebase-functions');

exports.dailyNotification = functions.pubsub
  .schedule('0 10 * * *')  // 10 AM daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const prompts = [
      "Share a travel tip",
      "Write about eSIM benefits",
      "Create connectivity advice"
    ];
    
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    await fetch('https://your-domain.com/api/ai-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Daily Travel Tip',
        prompt: randomPrompt
      })
    });
  });
```

## Best Practices

### 1. Prompt Engineering
- Be specific about tone and length
- Include character limits in prompts
- Request emoji usage for visual appeal
- Specify call-to-action if needed

**Good Prompt:**
```
"Create a friendly notification under 100 characters about eSIM activation, 
include an emoji and encourage action"
```

**Result:**
```
"✅ Ready to travel? Activate your eSIM in 60 seconds! Tap to get started 🚀"
```

### 2. Variety
Create a rotation of different prompt categories:
```javascript
const promptCategories = {
  monday: "Travel tip",
  tuesday: "eSIM education",
  wednesday: "Success story",
  thursday: "Promotional",
  friday: "Weekend travel inspiration",
  saturday: "User engagement",
  sunday: "Planning ahead"
};
```

### 3. Testing
Always test in `testMode` first:
```javascript
// Test the generation
const test = await fetch('/api/ai-notification', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "Your prompt here",
    testMode: true
  })
});

// Review the output
const result = await test.json();
console.log(result.generated.body);

// If satisfied, send for real
```

### 4. Timing
Best times to send notifications:
- **Morning (8-10 AM)**: Daily tips, educational content
- **Lunch (12-1 PM)**: Promotions, engagement
- **Evening (6-8 PM)**: Travel inspiration, weekend plans

### 5. Frequency
- **Daily**: 1 notification maximum
- **Weekly**: 3-5 notifications recommended
- **Special**: Event-based or promotional

## Cost Estimation

### OpenAI API Costs
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens
- Average notification: ~100 tokens
- 1 notification = ~$0.0002

**Monthly costs for daily notifications:**
- 30 days × $0.0002 = **~$0.006/month**
- Essentially free! 🎉

### FCM Costs
- Firebase Cloud Messaging is **FREE**
- Unlimited notifications

## Monitoring

Track notification performance:
```javascript
// Log to Firebase
{
  timestamp: Date.now(),
  prompt: "...",
  generated: "...",
  sent: 150,
  success: 148,
  failed: 2
}
```

## Troubleshooting

### "OpenAI API key not configured"
- Check `.env.local` file
- Verify key starts with `sk-proj-` or `sk-`
- Restart your dev server

### "No active FCM tokens found"
- Check `fcm_tokens` collection in Firestore
- Ensure users have granted notification permissions
- Verify tokens are marked as `active: true`

### AI generates inappropriate content
- Improve system prompt
- Add content filters
- Review and test prompts before using

## Security

⚠️ **Important:**
- Never expose API key in client-side code
- Implement rate limiting
- Add authentication to API endpoints
- Monitor API usage regularly
- Set OpenAI usage limits

## Support

For issues or questions:
- Check logs in Vercel/hosting dashboard
- Review OpenAI API usage at platform.openai.com
- Test with `testMode: true` first

