# Automated Daily Notifications Setup Guide

Complete guide to set up AI-generated daily notifications that run automatically.

## ✅ What You've Got

1. **OpenRouter AI Integration** - Generates unique notifications with various AI models
2. **Cron Endpoint** - `/api/cron/daily-notification` for scheduled execution  
3. **Admin UI** - Config tab with test button and status monitoring
4. **Vercel Cron** - Automatic scheduling via `vercel.json`

## 🚀 Quick Setup (3 Steps)

### Step 1: Configure OpenRouter in Admin Panel

1. Go to **Admin Panel** → **API Configuration** tab
2. Find **OpenRouter AI Configuration** section
3. Get API key from https://openrouter.ai/keys
4. Fill in:
   - **API Key**: `sk-or-v1-...`
   - **Model**: Choose from dropdown (recommend: `meta-llama/llama-3.1-8b-instruct:free` for FREE)
5. Click **Save AI Configuration**

### Step 2: Test It Works

1. In the **Automated Notifications** section below OpenRouter config
2. Click **Send Test Notification** button
3. Check that users receive the notification
4. Verify the generated message looks good

### Step 3: Deploy & Automate

**If using Vercel:**
```bash
# Push to deploy (vercel.json already configured)
git add .
git commit -m "Add automated daily notifications"
git push
```

Notifications will run automatically daily at 10 AM UTC! 🎉

**If using other platforms:**
See "Manual Setup" section below.

## 📅 Schedule Configuration

### Change the Time

Edit `vercel.json` to change schedule:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-notification",
      "schedule": "0 10 * * *"  // Change this
    }
  ]
}
```

### Schedule Examples

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Daily 10 AM UTC | `0 10 * * *` | Every day at 10 AM |
| Daily 9 AM & 6 PM | `0 9,18 * * *` | Twice daily |
| Weekdays 10 AM | `0 10 * * 1-5` | Monday-Friday only |
| Every 12 hours | `0 */12 * * *` | 12 AM and 12 PM |

**Time Zone Note:** Vercel Cron uses UTC. Convert your timezone:
- PST (UTC-8): 10 AM PST = `0 18 * * *` (6 PM UTC)
- EST (UTC-5): 10 AM EST = `0 15 * * *` (3 PM UTC)
- GMT+1: 10 AM = `0 9 * * *` (9 AM UTC)

## 🔧 Manual Setup (Non-Vercel)

### Option 1: cron-job.org (Free)

1. Go to https://cron-job.org/en/
2. Create free account
3. Click "Create cronjob"
4. Configure:
   - **Title**: Daily RoamJet Notifications
   - **URL**: `https://yourdomain.com/api/cron/daily-notification`
   - **Schedule**: `0 10 * * *` (Daily at 10 AM)
   - **Method**: POST
5. Save and enable

### Option 2: GitHub Actions (Free)

Create `.github/workflows/daily-notification.yml`:

```yaml
name: Daily Notification

on:
  schedule:
    - cron: '0 10 * * *'  # 10 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  send-notification:
    runs-on: ubuntu-latest
    steps:
      - name: Send Daily Notification
        run: |
          curl -X POST https://yourdomain.com/api/cron/daily-notification
```

### Option 3: EasyCron

1. Sign up at https://www.easycron.com/
2. Add new cron job
3. URL: `https://yourdomain.com/api/cron/daily-notification`
4. Method: POST
5. Schedule: Every day at 10:00

## 🎨 Customize Notification Content

Edit prompts in `/app/api/cron/daily-notification/route.js`:

```javascript
const dailyPrompts = [
  // Add your custom prompts here
  "Create a fun travel tip about eSIM, under 110 characters",
  "Share an exciting benefit of staying connected abroad",
  "Write a motivational travel message with eSIM theme",
  // ... more prompts
];
```

### Prompt Tips

- Keep under 110 characters for better mobile display
- Include emojis for visual appeal
- Rotate between different topics (tips, benefits, inspiration)
- Be friendly and actionable
- Test with "Send Test Notification" button

## 📊 Monitoring & Logs

### View Logs

**Vercel:**
```bash
vercel logs
```

**Or in Vercel Dashboard:**
1. Go to your project
2. Click **Logs** tab
3. Filter by `/api/cron/daily-notification`

### Check Success

Look for these log entries:
```
🤖 Daily notification cron job triggered
📝 Selected prompt: ...
✅ Daily notification sent successfully
📊 Stats: { success: 150, failed: 0 }
```

### Test Endpoint Manually

```bash
curl -X POST https://yourdomain.com/api/cron/daily-notification
```

## 🔒 Security (Optional)

Add authentication to cron endpoint:

1. Generate a secret:
```bash
openssl rand -base64 32
```

2. Add to environment variables:
```
CRON_SECRET=your-generated-secret-here
```

3. Call with authorization:
```bash
curl -X POST https://yourdomain.com/api/cron/daily-notification \
  -H "Authorization: Bearer your-generated-secret-here"
```

## 💰 Cost Estimation

### With Free Model (Llama 3.1)
- Cost: **$0/month** 🎉
- Daily notifications: Unlimited
- Perfect for testing and production

### With GPT-3.5 Turbo
- Cost per notification: ~$0.0002
- Daily to 1000 users: ~$0.20/month
- Monthly: ~$6/month for 1000 users

### With Gemini Flash
- Cost per notification: ~$0.0001
- Daily to 1000 users: ~$0.10/month
- Monthly: ~$3/month for 1000 users

**Recommendation:** Start with free Llama 3.1 model, upgrade if needed!

## 🐛 Troubleshooting

### Notifications not sending

**Check OpenRouter config:**
```
1. Admin Panel → Config tab
2. Verify API key is saved
3. Test with "Send Test Notification"
4. Check error message
```

**Common issues:**
- ❌ API key not configured → Add in admin panel
- ❌ Invalid API key → Verify at openrouter.ai/keys
- ❌ No FCM tokens → Users need mobile app installed
- ❌ Cron not running → Check Vercel logs

### Cron not triggering

**Vercel:**
- Verify `vercel.json` exists in root
- Redeploy: `vercel --prod`
- Check Vercel dashboard → Cron tab

**Other platforms:**
- Verify cron job is enabled
- Check cron service logs
- Test endpoint manually with curl

### AI generation fails

**Check model availability:**
- Some models have rate limits
- Try switching to free model
- Check OpenRouter dashboard for errors

## 📈 Advanced Features

### Multiple Daily Notifications

Add multiple cron entries:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-notification",
      "schedule": "0 9 * * *"  // Morning
    },
    {
      "path": "/api/cron/daily-notification",
      "schedule": "0 18 * * *"  // Evening
    }
  ]
}
```

### Target Specific Users

Modify the cron endpoint to filter users:

```javascript
// In route.js
const response = await fetch(`${baseUrl}/api/ai-notification`, {
  method: 'POST',
  body: JSON.stringify({
    title: 'Daily Tip',
    prompt: randomPrompt,
    userIds: ['user1', 'user2']  // Specific users only
  })
});
```

### A/B Testing

Create multiple cron endpoints with different prompts and track engagement.

## 🎯 Best Practices

1. **Test First** - Always test before enabling automation
2. **Start Simple** - Begin with once daily, increase if engagement is high
3. **Monitor Engagement** - Track notification open rates
4. **Vary Content** - Rotate different types of messages
5. **Respect Users** - Don't spam, keep frequency reasonable
6. **Time Zones** - Schedule for user's active hours
7. **Cost Control** - Start with free models, monitor usage

## ✅ Checklist

Before going live:

- [ ] OpenRouter API key configured
- [ ] AI model selected (free or paid)
- [ ] Test notification sent successfully
- [ ] Cron schedule configured
- [ ] Deployed to production
- [ ] Monitoring setup
- [ ] Costs estimated
- [ ] Backup cron service configured (optional)

## 🆘 Support

If you encounter issues:

1. Check admin panel test results
2. Review Vercel logs
3. Verify OpenRouter dashboard
4. Test endpoint manually with curl
5. Check FCM tokens in Firestore

## 🎉 You're Done!

Your automated daily notifications are now set up and running! Users will receive AI-generated travel tips and updates automatically every day.

**Next steps:**
- Monitor engagement and open rates
- Adjust schedule based on user activity
- Experiment with different AI models
- Add more varied prompts for better content

