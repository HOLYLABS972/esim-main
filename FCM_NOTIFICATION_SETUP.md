# FCM Notification Setup Guide

## Current Status ⚠️

Your notifications are currently showing **mock responses** because FCM credentials are not configured. Here's how to enable real notifications:

## Option 1: FCM Server Key (Quick Setup)

### Step 1: Get Server Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **esim-f0e3e**
3. Go to **Project Settings** → **Cloud Messaging** tab
4. Copy the **Server Key** (starts with `AAAA...`)

### Step 2: Set Environment Variable
```bash
# Add to your .env file or set directly
FCM_SERVER_KEY=AAAA...your_server_key_here
```

### Step 3: Restart Server
```bash
npm run dev
```

## Option 2: Firebase Admin SDK (Recommended for Production)

### Step 1: Generate Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **esim-f0e3e**
3. Go to **Project Settings** → **Service Accounts** tab
4. Click **"Generate new private key"**
5. Download the JSON file

### Step 2: Set Environment Variable
```bash
# Add to your .env file or set directly
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

### Step 3: Update Code (if using Admin SDK)
The current code will automatically use Admin SDK if credentials are available.

## Testing FCM Notifications

### Check FCM Tokens
```bash
curl -X GET http://localhost:3000/api/fcm-tokens
```

### Test Notification Sending
```bash
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello World","tokens":["your_fcm_token_here"]}'
```

## Troubleshooting

### 1. Check Server Logs
Look for these messages in your terminal:
- ✅ `FCM notification sent successfully` - Working
- ⚠️ `FCM_SERVER_KEY not set, returning mock response` - Need setup
- ❌ `FCM notification error` - Configuration issue

### 2. Verify FCM Tokens
Make sure your mobile app is saving FCM tokens:
- Check Firebase Console → Firestore → `fcm_tokens` collection
- Look for documents with `platform: "ios"` or `platform: "android"`

### 3. Check Mobile App
Ensure your mobile app is:
- ✅ Saving FCM tokens to Firestore
- ✅ Handling incoming notifications
- ✅ Requesting notification permissions

## Current Configuration

- **Project ID**: esim-f0e3e
- **Sender ID**: 482450515497
- **API Version**: V1 (enabled)
- **Legacy API**: Disabled (deprecated)

## Next Steps

1. **Choose setup method** (Server Key or Admin SDK)
2. **Configure credentials** as shown above
3. **Test notifications** from web dashboard
4. **Verify delivery** on mobile devices

Once configured, your notifications will be sent to real devices instead of mock responses! 🚀
