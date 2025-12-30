# Stripe Production Setup Guide

This guide will walk you through moving your Stripe integration from test mode to production.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com if you don't have one)
2. Access to your Vercel project dashboard
3. Access to your Firebase Firestore database
4. Your production domain ready

## Step 1: Get Your Production Stripe Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Live mode** (toggle in the top right)
3. Navigate to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_live_...`)
5. Copy your **Secret key** (starts with `sk_live_...`) - click "Reveal test key" if needed

⚠️ **Important**: Never share your secret key publicly. It should only be used server-side.

## Step 2: Configure Environment Variables in Vercel

### Option A: Using Vercel Stripe Integration (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Integrations**
4. Find and connect the **Stripe** integration
5. This automatically provides:
   - `STRIPE_SECRET_KEY` (automatically uses the correct key based on environment)
   - `STRIPE_PUBLISHABLE_KEY` (for frontend use)

✅ **This is the easiest method** - Vercel automatically manages which keys to use.

### Option B: Manual Environment Variables Setup

If you prefer manual setup:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### For Production Environment:

**Publishable Key (Frontend):**
- **Key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
- **Value**: `pk_live_...` (your production publishable key)
- **Environment**: Select `Production` only

**Secret Key (Backend):**
- **Key**: `STRIPE_LIVE_SECRET_KEY`
- **Value**: `sk_live_...` (your production secret key)
- **Environment**: Select `Production` only

**Optional - Set Mode:**
- **Key**: `STRIPE_MODE`
- **Value**: `live` or `production`
- **Environment**: Select `Production` only

#### For Preview/Development (if you want to keep test mode):

**Test Publishable Key:**
- **Key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST`
- **Value**: `pk_test_...` (your test publishable key)
- **Environment**: Select `Preview` and `Development`

**Test Secret Key:**
- **Key**: `STRIPE_TEST_SECRET_KEY`
- **Value**: `sk_test_...` (your test secret key)
- **Environment**: Select `Preview` and `Development`

**Test Mode:**
- **Key**: `STRIPE_MODE`
- **Value**: `test`
- **Environment**: Select `Preview` and `Development`

## Step 3: Configure Firestore for Production Keys

Your app can also read Stripe keys from Firestore. To set this up:

1. Go to your Firebase Console
2. Navigate to **Firestore Database**
3. Create or update the document at `config/stripe` with:

```json
{
  "mode": "production",
  "livePublishableKey": "pk_live_...",
  "liveSecretKey": "sk_live_...",
  "live_publishable_key": "pk_live_...",
  "live_secret_key": "sk_live_..."
}
```

**Note**: The code checks for both `livePublishableKey`/`liveSecretKey` and `live_publishable_key`/`live_secret_key` formats.

## Step 4: Set Production Mode

The app determines which Stripe mode to use in this priority order:

1. **URL parameter**: `?mode=production` (for testing)
2. **Firestore**: `config/stripe` → `mode` field
3. **localStorage**: `esim_stripe_mode` (fallback)
4. **Default**: `production`

### To set in Firestore:

Update the `config/stripe` document:
```json
{
  "mode": "production"
}
```

### To verify mode:

Check your browser console when the app loads. You should see:
- `✅ Stripe mode loaded from Firestore: production`
- `🔑 Loading Stripe in PRODUCTION mode`
- `🔑 Using LIVE publishable key from Firebase` or `🔑 Using LIVE publishable key from environment`

## Step 5: Redeploy Your Application

After setting environment variables:

1. **Redeploy** your Vercel project (environment variables require redeployment)
2. Go to your Vercel dashboard → **Deployments**
3. Click the **"..."** menu on your latest deployment
4. Select **"Redeploy"**

Or trigger a new deployment by pushing to your main branch.

## Step 6: Verify Production Setup

### Check Backend (API Route):

1. Make a test payment attempt
2. Check Vercel function logs:
   - Should see: `✅ Using STRIPE_SECRET_KEY from Vercel integration (LIVE mode)`
   - Or: `✅ Using live secret key from environment variables`

### Check Frontend:

1. Open browser console
2. Look for these messages:
   - `✅ Stripe mode loaded from Firestore: production`
   - `🔑 Loading Stripe in PRODUCTION mode`
   - `🔑 Using LIVE publishable key from Firebase` or `🔑 Using LIVE publishable key from environment`

### Test a Payment:

1. Try making a small test purchase
2. Use Stripe's [test card numbers](https://stripe.com/docs/testing) if you want to test without real charges
3. Or use a real card for a small amount to verify production is working

## Step 7: Configure Webhooks (If Needed)

If you're using Stripe webhooks:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter your production webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to (e.g., `checkout.session.completed`, `payment_intent.succeeded`)
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to Vercel environment variables:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...`
   - **Environment**: `Production`

## Step 8: Security Checklist

Before going live, ensure:

- ✅ Production secret keys are **never** exposed in frontend code
- ✅ Secret keys only have `NEXT_PUBLIC_` prefix for publishable keys
- ✅ Environment variables are set only for the correct environments
- ✅ Firestore security rules prevent unauthorized access to `config/stripe`
- ✅ Webhook endpoints verify signatures
- ✅ HTTPS is enabled on your production domain
- ✅ Test mode is disabled in production environment

## Troubleshooting

### Issue: "Stripe keys not configured"

**Solution**: 
- Check that environment variables are set in Vercel
- Ensure you've redeployed after adding variables
- Verify the variable names match exactly (case-sensitive)

### Issue: Still using test keys in production

**Solution**:
- Check Firestore `config/stripe` document has `mode: "production"`
- Clear browser localStorage: `localStorage.removeItem('esim_stripe_mode')`
- Verify environment variables are set for `Production` environment only
- Check URL doesn't have `?mode=test` parameter

### Issue: Payment fails with "Invalid API Key"

**Solution**:
- Verify you copied the full key (they're long)
- Check you're using `pk_live_...` and `sk_live_...` (not test keys)
- Ensure keys are from the **Live mode** in Stripe dashboard
- Redeploy after changing environment variables

### Issue: Can't see environment variables in Vercel

**Solution**:
- Make sure you're looking at the correct project
- Check you have admin/owner permissions
- Environment variables are project-specific

## Key Priority Order Reference

### Publishable Key (Frontend):
1. Hardcoded test key (if mode is `test` or `sandbox`)
2. Firestore: `config/stripe` → `livePublishableKey` or `live_publishable_key`
3. Environment: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
4. Environment: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Secret Key (Backend):
1. **Vercel Integration**: `STRIPE_SECRET_KEY` (auto-provided)
2. Environment: `STRIPE_LIVE_SECRET_KEY` (for live mode)
3. Environment: `STRIPE_SECRET_KEY` (fallback)
4. Environment: `STRIPE_KEY` (for live mode)
5. Environment: `STRIPE_TEST_SECRET_KEY` (for test mode)

## Additional Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## Support

If you encounter issues:
1. Check Vercel function logs for detailed error messages
2. Check browser console for frontend errors
3. Verify Stripe dashboard shows the transactions
4. Review the `STRIPE_ENV_SETUP.md` file for additional configuration details

