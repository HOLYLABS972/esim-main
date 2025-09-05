# Stripe Setup Guide

## 🔑 Setting Up Stripe Keys in Firestore

Since environment variables aren't loading properly in Vercel, we're now storing Stripe keys in your Firestore database for better reliability.

### 📍 Database Structure

Create a document in your Firestore database:

**Collection**: `config`
**Document ID**: `stripe`

### 📝 Document Fields

```json
{
  "mode": "test", // or "live"
  "testPublishableKey": "pk_test_51LXRaMDoWGog1gVB88ytV8ZVHdl4aZqKA6fImyAKhFPLrxFESftTeqLQIquHH18X2TDQUdbvMLDCRRfgPzeaa0cm00sUIflyfu",
  "livePublishableKey": "pk_live_51LXRaMDoWGog1gVBfrXi6V1ckLsxLckVbXdcWjhh2uI50T7kXK4zqGjU0ONp6mCdOiseceeLjceZiAn4xKCGCvKz00kr7NS4tn",
  "testSecretKey": "sk_test_...", // for server-side use
  "liveSecretKey": "sk_live_...", // for server-side use
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 🚀 How to Set This Up

#### Option 1: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `esim-f0e3e`
3. Go to Firestore Database
4. Create collection: `config`
5. Create document with ID: `stripe`
6. Add the fields above

#### Option 2: Admin Panel
1. Go to your app's `/admin` route
2. Look for Stripe configuration section
3. Enter your keys there (if the admin panel supports it)

#### Option 3: Programmatically
You can also set this up programmatically using Firebase Admin SDK or through your admin dashboard.

### 🔍 What Happens Now

1. **App loads Stripe mode** from Firestore (`test` or `live`)
2. **App loads corresponding key** from the same document
3. **Fallback to environment variables** if Firestore doesn't have keys
4. **Better reliability** - no more environment variable loading issues

### ✅ Benefits

- ✅ **More reliable** than environment variables
- ✅ **Easier to manage** through admin panel
- ✅ **Real-time updates** without redeployment
- ✅ **Better debugging** with detailed logs
- ✅ **Fallback support** to environment variables

### 🐛 Troubleshooting

If you still see "No Stripe publishable key found":

1. **Check Firestore** - Make sure the `config/stripe` document exists
2. **Check console logs** - Look for detailed debugging information
3. **Verify mode** - Make sure `mode` field matches what you expect
4. **Check key names** - Use `testPublishableKey` and `livePublishableKey`

### 📱 Test the Setup

1. **Set up the Firestore document** with your keys
2. **Go to admin panel** and set Stripe mode to `test`
3. **Try checkout** - you should see detailed logs in console
4. **Switch to live mode** and test again

The app will now load your Stripe keys from the database instead of relying on environment variables!
