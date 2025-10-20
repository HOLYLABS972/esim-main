# Stripe Test Mode Setup

Your frontend is now configured to automatically use test Stripe routes when in test mode!

## How It Works

The system automatically detects the Stripe mode and uses the appropriate endpoints:

### Test Mode Routes (uses STRIPE_TEST_KEY)
- `/test/create-payment-intent`
- `/test/create-checkout-session`
- `/test/create-payment-order`
- `/test/retrieve-session`
- `/test/create-customer-portal-session`
- `/test/check-subscription-status`

### Live Mode Routes (uses STRIPE_LIVE_KEY)
- `/create-payment-intent`
- `/create-checkout-session`
- `/create-payment-order`
- `/retrieve-session`
- `/create-customer-portal-session`
- `/check-subscription-status`

## How to Switch to Test Mode

### Option 1: Firebase Console (Recommended)

1. Go to your Firebase Console
2. Navigate to Firestore Database
3. Find or create: `config` collection → `stripe` document
4. Set the field:
   ```
   mode: "test"
   ```
5. Refresh your application

### Option 2: Browser Console (Quick Test)

1. Open your browser console (F12)
2. Run this command:
   ```javascript
   localStorage.setItem('esim_stripe_mode', 'test');
   ```
3. Refresh the page

## Verification

When you make a payment, check the browser console. You should see:

```
🔑 Loading Stripe in TEST mode
🧪 TEST MODE: Using test endpoint /test/create-payment-order
```

## Test Card Numbers

Use these Stripe test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Switch Back to Live Mode

To switch back to production:

1. In Firebase: Set `mode: "live"` or `mode: "production"`
2. Or in console: `localStorage.setItem('esim_stripe_mode', 'live');`
3. Refresh the page

## Current Configuration

- **Test Key**: Hardcoded in `src/services/configService.js`
- **Test Routes**: Automatically used when mode is "test" or "sandbox"
- **Backend URL**: `https://pay.roamjet.net`

## Files Modified

1. `src/services/paymentService.js` - Added automatic endpoint routing
2. `src/services/configService.js` - Hardcoded test key, improved mode detection

## Troubleshooting

### Payments not using test mode?

1. Check browser console for mode detection logs
2. Verify Firestore config: `config/stripe` document has `mode: "test"`
3. Clear browser cache and localStorage
4. Check that backend `/test/*` routes are available

### Want to see which mode is active?

Check the browser console when loading the payment page. You'll see:
```
🔍 Getting Stripe publishable key for mode: test
🔑 Using hardcoded TEST publishable key
```

## Support

If you need help, check the console logs - they show exactly which mode and endpoint are being used for each payment operation.



