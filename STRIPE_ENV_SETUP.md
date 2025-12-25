# Stripe Environment Variables Setup

## Using Vercel Stripe Integration (Recommended)

The easiest way to set up Stripe is through Vercel's Stripe integration:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Integrations**
3. Find and connect the **Stripe** integration
4. This automatically provides `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` environment variables

The checkout session endpoint (`/api/payments/create-checkout-session`) will automatically use these variables.

## Manual Environment Variables Setup

If you prefer to set environment variables manually, add these in your Vercel project settings:

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

### Secret Key (Backend - Checkout Session Endpoint):
1. **Vercel Stripe Integration**: `STRIPE_SECRET_KEY` (automatically provided by Vercel integration)
2. Environment variable: `STRIPE_LIVE_SECRET_KEY` (for live mode)
3. Environment variable: `STRIPE_SECRET_KEY` (fallback if not from integration)
4. Environment variable: `STRIPE_KEY` (for live mode)
5. Environment variable: `STRIPE_TEST_SECRET_KEY` (for test mode)
6. Environment variable: `STRIPE_TEST_KEY` (for test mode)

**Note**: The checkout session endpoint (`/api/payments/create-checkout-session`) uses only environment variables and no longer uses Firebase Remote Config.

## Checkout Session Endpoint

The `/api/payments/create-checkout-session` endpoint uses environment variables only:
- **Priority 1**: `STRIPE_SECRET_KEY` from Vercel Stripe integration
- **Priority 2**: Mode-specific keys (`STRIPE_LIVE_SECRET_KEY` or `STRIPE_TEST_SECRET_KEY`)
- **Priority 3**: Fallback keys (`STRIPE_KEY`, `STRIPE_TEST_KEY`)

This endpoint no longer uses Firebase Remote Config or Firestore.

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

