# Lemon Squeezy Integration Setup Guide

This guide explains how to activate and configure Lemon Squeezy for affiliate payments in your eSIM application.

## Overview

Lemon Squeezy has been integrated as a payment option alongside Stripe and Coinbase. It's particularly useful for affiliate programs as it has built-in affiliate tracking capabilities.

## Configuration Steps

### 1. Get Your Lemon Squeezy Credentials

1. Sign up or log in to [Lemon Squeezy](https://lemonsqueezy.com)
2. Go to **Settings** → **API**
3. Create a new API key (or use an existing one)
4. Copy your **Store ID** from the store settings
5. Set up a webhook secret (we'll configure this in step 3)

### 2. Configure in Firebase Firestore

Add your Lemon Squeezy credentials to Firestore:

**Collection:** `config`  
**Document ID:** `lemonsqueezy`

```json
{
  "api_key": "your-api-key-here",
  "store_id": "your-store-id-here",
  "webhook_secret": "e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c"
}
```

**Note:** Replace the `webhook_secret` with your generated secret (or use the example above). Make sure to use the **same secret** in both Lemon Squeezy webhook settings and this Firestore config.

### 3. Set Up Webhook (Important for Payment Confirmation)

1. Generate a secure webhook secret (or use the one below):
   ```bash
   openssl rand -hex 32
   ```
   
   **Example webhook secret:**
   ```
   e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c
   ```

2. In Lemon Squeezy dashboard, go to **Settings** → **Webhooks**
3. Add a new webhook endpoint:
   - **URL:** `https://yourdomain.com/api/webhooks/lemonsqueezy`
   - **Signing Secret:** Use the webhook secret you generated above
   - **Events to listen for:**
     - `order_created`
     - `order_paid`
     - `subscription_created` (if you plan to use subscriptions)
     - `subscription_updated`
     - `subscription_cancelled`
4. Add the same webhook secret to your Firestore config (see step 2 above)

### 4. Environment Variables (Alternative to Firestore)

If you prefer using environment variables instead of Firestore:

```env
LEMON_SQUEEZY_API_KEY=your-api-key-here
LEMON_SQUEEZY_STORE_ID=your-store-id-here
LEMON_SQUEEZY_WEBHOOK_SECRET=e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c
```

**Note:** Replace the `LEMON_SQUEEZY_WEBHOOK_SECRET` with your generated secret (or use the example above). Make sure to use the **same secret** in both Lemon Squeezy webhook settings and this environment variable.

## How It Works

### Payment Flow

1. **User selects Lemon Squeezy** as payment method
2. **Checkout session is created** via `/api/lemonsqueezy/create-checkout`
3. **User is redirected** to Lemon Squeezy checkout page
4. **After payment**, user is redirected back to `/payment-success` with order details
5. **Webhook confirms payment** and updates order status in Firestore
6. **eSIM is activated** via the existing order creation flow

### Affiliate Tracking

Lemon Squeezy automatically tracks:
- Referral sources
- Affiliate commissions
- Conversion rates
- Revenue attribution

You can view affiliate performance in your Lemon Squeezy dashboard under **Affiliates**.

## Testing

1. Use Lemon Squeezy's test mode (if available) or create a test order
2. Verify the checkout redirect works
3. Complete a test payment
4. Check that the webhook receives the `order_paid` event
5. Verify the order is created in Firestore with `paymentStatus: 'confirmed'`
6. Confirm the eSIM QR code is generated

## Troubleshooting

### Payment button not showing
- Check that `api_key` and `store_id` are configured in Firestore
- Verify the service initializes correctly (check browser console)
- Ensure `lemonSqueezyAvailable` state is `true`

### Webhook not receiving events
- Verify webhook URL is accessible (not localhost)
- Check webhook secret matches in both Lemon Squeezy and Firestore
- Review webhook logs in Lemon Squeezy dashboard
- Check server logs for webhook errors

### Payment success page not processing
- Verify URL parameters are being passed correctly
- Check that `payment_method=lemonsqueezy` is in the redirect URL
- Ensure order data includes `order_id`, `email`, `total`, and `plan` parameters

## Files Modified/Created

### New Files
- `/src/services/lemonSqueezyService.js` - Lemon Squeezy service
- `/app/api/lemonsqueezy/create-checkout/route.js` - Checkout creation endpoint
- `/app/api/webhooks/lemonsqueezy/route.js` - Webhook handler

### Modified Files
- `/src/services/configService.js` - Added `getLemonSqueezyConfig()` method
- `/src/components/PaymentSuccess.jsx` - Added Lemon Squeezy payment handling
- `/src/components/Checkout.jsx` - Added Lemon Squeezy payment option
- `/app/share-package/[packageId]/page.jsx` - Added Lemon Squeezy payment button

## Next Steps

1. Configure your Lemon Squeezy credentials in Firestore
2. Set up the webhook endpoint
3. Test a payment flow
4. Set up affiliate tracking in Lemon Squeezy dashboard (if needed)
5. Monitor webhook events and order processing

## Support

For issues or questions:
- Check Lemon Squeezy API documentation: https://docs.lemonsqueezy.com
- Review webhook logs in Lemon Squeezy dashboard
- Check application logs in Firebase Console
