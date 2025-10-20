# Quick Start: Test Stripe Payments

## ✅ What's Done

Your frontend is now fully configured to use Stripe test mode!

### Changes Made:

1. **Test key hardcoded** in `src/services/configService.js`
2. **Automatic route switching** in `src/services/paymentService.js`
3. **All payment methods** now support test mode

## 🚀 How to Use Test Mode

### Step 1: Enable Test Mode

Open your browser console and run:
```javascript
localStorage.setItem('esim_stripe_mode', 'test');
```

### Step 2: Refresh Your Page

That's it! The system will automatically:
- Use the hardcoded test key
- Route all requests to `/test/*` endpoints
- Show test mode indicators in console

### Step 3: Test a Payment

When you make a payment:
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC and ZIP code

## 🔍 Verify It's Working

In the browser console, you should see:
```
🔑 Loading Stripe in TEST mode
🧪 TEST MODE: Using test endpoint /test/create-payment-order
```

## 📋 Available Test Routes

All these routes automatically use `STRIPE_TEST_KEY`:
- ✅ `/test/create-payment-intent`
- ✅ `/test/create-checkout-session`  
- ✅ `/test/create-payment-order`
- ✅ `/test/retrieve-session`
- ✅ `/test/create-customer-portal-session`
- ✅ `/test/check-subscription-status`

## 🔄 Switch Back to Live

```javascript
localStorage.setItem('esim_stripe_mode', 'live');
```

Then refresh the page.

## 📝 Notes

- Test key is: `pk_test_51QgvHMDAQpPJFhcuO3sh2pE1JSysFYHgJo781w5lzeDX6Qh9P026LaxpeilCyXx73TwCLHcF5O0VQU45jPZhLBK800G6bH5LdA`
- Backend: `https://pay.roamjet.net`
- Mode persists in localStorage across sessions
- Console logs show exactly what's happening

## 🎯 That's It!

You're ready to test Stripe payments. Just set the mode to "test" and start making test payments!



