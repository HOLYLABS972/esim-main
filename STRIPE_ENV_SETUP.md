# Stripe Environment Variables Setup

## Required Environment Variables

### For Vercel Deployment

Add these environment variables in your Vercel project settings:

#### Stripe Publishable Keys (Frontend - Public)
These are safe to expose in the frontend and must start with `NEXT_PUBLIC_`:

1. **Production/Live Key:**
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
   ```
   OR
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

2. **Test/Sandbox Key (Optional):**
   - Currently hardcoded in `configService.js` for test mode
   - You can override by setting:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
   ```

#### Stripe Secret Keys (Backend - Private)
These are server-side only and should NEVER be exposed:

1. **Production/Live Secret Key:**
   ```
   STRIPE_LIVE_SECRET_KEY=sk_live_...
   ```
   OR
   ```
   STRIPE_SECRET_KEY=sk_live_...
   ```
   OR
   ```
   STRIPE_KEY=sk_live_...
   ```

2. **Test/Sandbox Secret Key:**
   ```
   STRIPE_TEST_SECRET_KEY=sk_test_...
   ```
   OR
   ```
   STRIPE_TEST_KEY=sk_test_...
   ```

3. **Stripe Mode (Optional):**
   ```
   STRIPE_MODE=test
   ```
   or
   ```
   STRIPE_MODE=live
   ```
   (Default: `live` if not set)

## How to Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
   - **Value**: Your Stripe publishable key (starts with `pk_live_...`)
   - **Environment**: Select `Production`, `Preview`, and/or `Development` as needed
4. Click **Save**
5. Repeat for all required variables

## Priority Order

The code checks for keys in this order:

### Publishable Key (Frontend):
1. Hardcoded test key (if mode is `test` or `sandbox`)
2. Firestore config: `config/stripe` → `livePublishableKey` or `live_publishable_key`
3. Environment variable: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
4. Environment variable: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Secret Key (Backend):
1. Environment variable: `STRIPE_LIVE_SECRET_KEY` (for live mode)
2. Environment variable: `STRIPE_SECRET_KEY` (for live mode)
3. Environment variable: `STRIPE_KEY` (for live mode)
4. Environment variable: `STRIPE_TEST_SECRET_KEY` (for test mode)
5. Environment variable: `STRIPE_TEST_KEY` (for test mode)
6. Firestore config: `config/stripe` → `liveSecretKey` or `live_secret_key`

## Alternative: Firestore Configuration

Instead of environment variables, you can store keys in Firestore:

1. Go to Firestore Console
2. Create/Update document: `config/stripe`
3. Add fields:
   - `livePublishableKey`: `pk_live_...`
   - `liveSecretKey`: `sk_live_...` (for server-side use)
   - `mode`: `live` or `test`

## Testing

After setting environment variables:

1. **Redeploy** your Vercel project (environment variables require redeployment)
2. Check browser console for:
   - `🔑 Using LIVE publishable key from environment` (if using env vars)
   - `🔑 Using LIVE publishable key from Firebase` (if using Firestore)

## Security Notes

- ✅ **Publishable keys** (`pk_...`) are safe to expose in frontend code
- ❌ **Secret keys** (`sk_...`) must NEVER be exposed in frontend
- Always use `NEXT_PUBLIC_` prefix for frontend-accessible variables
- Secret keys should NOT have `NEXT_PUBLIC_` prefix

