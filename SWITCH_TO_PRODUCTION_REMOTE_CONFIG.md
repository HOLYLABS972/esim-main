# Switch to Production Using Firebase Remote Config

This guide shows you how to switch from sandbox to production mode using Firebase Remote Config.

## ⚡ Quick Method: Update Remote Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Remote Config** (in the left sidebar under "Build")
4. If you don't have any parameters yet, click **"Add parameter"**
5. Create or update these parameters:

### Required Parameter: Stripe Mode

**Parameter key**: `stripe_mode`
- **Data type**: String
- **Default value**: `production`
- **Value**: `production` (to switch from sandbox)

### Optional: Stripe Keys (if stored in Remote Config)

**Parameter key**: `stripe_live_publishable_key`
- **Data type**: String
- **Value**: Your production publishable key (`pk_live_...`)

**Parameter key**: `stripe_live_secret_key`
- **Data type**: String
- **Value**: Your production secret key (`sk_live_...`)
- ⚠️ **Note**: Secret keys should typically be in environment variables, not Remote Config

6. Click **"Publish changes"** to activate

## Step-by-Step Instructions

### Step 1: Access Remote Config

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your Firebase project
3. In the left sidebar, click **"Remote Config"** (under "Build" section)
4. If this is your first time, you'll see an empty dashboard

### Step 2: Add or Update Stripe Mode Parameter

1. Click **"Add parameter"** (or edit existing `stripe_mode` parameter)
2. Enter parameter key: `stripe_mode`
3. Set the value to: `production`
4. Click **"Save"**

### Step 3: Publish Changes

1. After adding/updating parameters, click **"Publish changes"** button at the top
2. Confirm the publish action
3. Changes take effect immediately (no app restart needed)

### Step 4: Verify the Change

1. Refresh your app in the browser
2. Open browser console (F12)
3. Look for these messages:
   - `✅ Stripe mode loaded from Remote Config: production`
   - `🔑 Loading Stripe in PRODUCTION mode`
   - `🔑 Using LIVE publishable key...`

## Priority Order

The app checks for Stripe mode in this order:

1. **URL parameter**: `?mode=production` (temporary override)
2. **Remote Config**: `stripe_mode` parameter ⭐ (Your current setup)
3. **Firestore**: `config/stripe` → `mode` field
4. **localStorage**: `esim_stripe_mode`
5. **Default**: `production`

## Remote Config Parameter Reference

### Required Parameters

| Parameter Key | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `stripe_mode` | String | Stripe mode (test/sandbox/production) | `production` |

### Optional Parameters (if you store keys in Remote Config)

| Parameter Key | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `stripe_live_publishable_key` | String | Production publishable key | `pk_live_...` |
| `stripe_live_secret_key` | String | Production secret key | `sk_live_...` |

⚠️ **Security Note**: It's recommended to store secret keys in Vercel environment variables, not Remote Config, as Remote Config values are accessible to clients.

## Using Conditions (Advanced)

You can set different values for different conditions:

1. Click on a parameter
2. Click **"Add value for condition"**
3. Create conditions based on:
   - App version
   - User properties
   - Platform (iOS/Android/Web)
   - Random percentile

Example: Set `stripe_mode` to `sandbox` for test users and `production` for everyone else.

## Troubleshooting

### Changes not taking effect?

1. **Clear browser cache** and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
2. **Check Remote Config fetch interval**: The app fetches Remote Config every hour by default
3. **Force fetch**: The app will fetch on next page load
4. **Check console**: Look for Remote Config errors in browser console

### Still showing sandbox mode?

1. Check URL doesn't have `?mode=sandbox` parameter
2. Verify Remote Config parameter `stripe_mode` is set to `production`
3. Check that changes were **published** (not just saved as draft)
4. Clear localStorage: `localStorage.removeItem('esim_stripe_mode')`

### Remote Config not loading?

1. Check Firebase project is correctly configured
2. Verify Remote Config is enabled in Firebase Console
3. Check browser console for Remote Config initialization errors
4. Ensure you're using the correct Firebase project

## Important: Production Keys Required

Before switching to production, ensure you have:

✅ **Production Publishable Key** (`pk_live_...`) in:
   - Remote Config: `stripe_live_publishable_key` (optional)
   - OR Firestore: `config/stripe` → `livePublishableKey`
   - OR Vercel: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`

✅ **Production Secret Key** (`sk_live_...`) in:
   - Vercel: `STRIPE_SECRET_KEY` (from Stripe integration - recommended)
   - OR Vercel: `STRIPE_LIVE_SECRET_KEY`

See `STRIPE_PRODUCTION_SETUP.md` for complete setup instructions.

## Benefits of Using Remote Config

- ✅ **No code deployment needed** - Change mode instantly
- ✅ **A/B testing** - Test different modes for different user groups
- ✅ **Rollback** - Quickly revert changes if needed
- ✅ **Conditional values** - Different modes for different conditions
- ✅ **Analytics** - Track which values are being used

## Next Steps

After switching to production:

1. ✅ Verify mode is `production` in browser console
2. ✅ Test a payment with a real card (small amount)
3. ✅ Check Stripe Dashboard for live transactions
4. ✅ Monitor for any errors in Vercel function logs

