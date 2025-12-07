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

You can create the webhook in two ways:

#### Option A: Create Webhook via Dashboard (Recommended for beginners)

#### Option B: Create Webhook via API (Programmatic)

If you prefer to create the webhook programmatically, you can use one of these methods:

**Method 1: Using the Node.js script**

```bash
# Set environment variables
export LEMON_SQUEEZY_API_KEY="your-api-key"
export LEMON_SQUEEZY_STORE_ID="your-store-id"
export WEBHOOK_URL="https://yourdomain.com/api/webhooks/lemonsqueezy"
export LEMON_SQUEEZY_WEBHOOK_SECRET="e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c"

# Run the script
node scripts/create-lemonsqueezy-webhook.js
```

**Method 2: Using the API endpoint**

Make a POST request to your API:

```bash
curl -X POST "https://yourdomain.com/api/lemonsqueezy/create-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://yourdomain.com/api/webhooks/lemonsqueezy",
    "webhookSecret": "e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c",
    "events": ["order_created", "order_paid"]
  }'
```

**Method 3: Using curl directly to Lemon Squeezy API**

Replace the placeholders with your actual values:
- `{api_key}` → Your Lemon Squeezy API key
- `1` → Your Store ID (from Lemon Squeezy dashboard)
- `https://mysite.com/webhooks/` → Your webhook URL (e.g., `https://yourdomain.com/api/webhooks/lemonsqueezy`)
- `SIGNING_SECRET` → Your webhook secret (use: `e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c`)

```bash
curl -X "POST" "https://api.lemonsqueezy.com/v1/webhooks" \
  -H 'Accept: application/vnd.api+json' \
  -H 'Content-Type: application/vnd.api+json' \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "data": {
      "type": "webhooks",
      "attributes": {
        "url": "https://yourdomain.com/api/webhooks/lemonsqueezy",
        "events": [
          "order_created",
          "order_paid",
          "subscription_created",
          "subscription_updated",
          "subscription_cancelled"
        ],
        "secret": "e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c"
      },
      "relationships": {
        "store": {
          "data": {
            "type": "stores",
            "id": "YOUR_STORE_ID"
          }
        }
      }
    }
  }'
```

**Example with actual values:**

```bash
curl -X "POST" "https://api.lemonsqueezy.com/v1/webhooks" \
  -H 'Accept: application/vnd.api+json' \
  -H 'Content-Type: application/vnd.api+json' \
  -H "Authorization: Bearer ls_abc123xyz789..." \
  -d '{
    "data": {
      "type": "webhooks",
      "attributes": {
        "url": "https://esim.roamjet.net/api/webhooks/lemonsqueezy",
        "events": [
          "order_created",
          "order_paid"
        ],
        "secret": "e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c"
      },
      "relationships": {
        "store": {
          "data": {
            "type": "stores",
            "id": "12345"
          }
        }
      }
    }
  }'
```

---

#### Option A: Create Webhook via Dashboard (Recommended for beginners)

**⚠️ IMPORTANT: The webhook secret is REQUIRED and must be the same in both places!**

1. Generate a secure webhook secret (or use the one below):
   ```bash
   openssl rand -hex 32
   ```
   
   **Ready-to-use webhook secret (copy this):**
   ```
   e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c
   ```

2. In Lemon Squeezy dashboard, go to **Settings** → **Webhooks**
3. Click **"Create Webhook"** or **"Add Webhook"**
4. Fill in the webhook form:
   - **Webhook URL:** `https://yourdomain.com/api/webhooks/lemonsqueezy`
     - Replace `yourdomain.com` with your actual domain
     - Example: `https://esim.roamjet.net/api/webhooks/lemonsqueezy`
   
   - **Signing Secret:** ⚠️ **REQUIRED FIELD** - Paste the webhook secret from step 1:
     ```
     e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c
     ```
     - This secret is used to verify webhook requests via the `X-Signature` header
     - Must be between 6-40 characters (our generated secret is 64 hex characters, which is fine)
     - **You MUST use the same secret in both Lemon Squeezy AND your Firestore config**
   
   - **Events to listen for:** Select these events:
     - ✅ `order_created`
     - ✅ `order_paid`
     - ✅ `subscription_created` (optional, if you plan to use subscriptions)
     - ✅ `subscription_updated` (optional)
     - ✅ `subscription_cancelled` (optional)

5. **Save the webhook** in Lemon Squeezy dashboard

6. **Add the SAME webhook secret to your Firestore config** (see step 2 above)
   - The secret in Firestore must match exactly the one you entered in Lemon Squeezy
   - This is critical for webhook signature verification to work

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
- **Check webhook secret matches EXACTLY in both Lemon Squeezy and Firestore** (this is critical!)
- Verify the "Signing Secret" field is filled in Lemon Squeezy dashboard (it's required)
- Review webhook logs in Lemon Squeezy dashboard
- Check server logs for webhook errors
- Verify the `X-Signature` header is being received and validated correctly

### "The {0} field is required" error in Lemon Squeezy
- This means the **Signing Secret** field is empty
- You MUST enter a webhook secret (use the one provided: `e4c2e3a2b39ea58a4005c6066293282432b45c8ef859b9678e0c78d92af77f5c`)
- The secret must be the same in both Lemon Squeezy dashboard AND your Firestore config

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
