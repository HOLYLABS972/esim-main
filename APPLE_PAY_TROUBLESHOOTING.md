# 🍎 Apple Pay Troubleshooting Guide

## Quick Debug Steps

### 1. Check Device Requirements
- **iOS Device**: Apple Pay only works on iOS devices
- **iOS Version**: Requires iOS 10.0 or later
- **Device Model**: iPhone 6 or later, iPad Pro, iPad Air 2, iPad mini 3 or later
- **Touch ID/Face ID**: Device must have biometric authentication set up

### 2. Check Apple Pay Setup
- **Wallet App**: Apple Pay must be set up in the Wallet app
- **Payment Cards**: At least one payment card must be added to Apple Pay
- **Card Verification**: Cards must be verified and active

### 3. Check App Configuration

#### A. Stripe Configuration
```dart
// Check these in your app logs:
✅ Stripe initialized with live mode and Apple Pay merchant identifier
🍎 Merchant ID: merchant.theholylabs.com
🍎 Apple Pay availability check: true
```

#### B. Firebase Function
```python
# Check payment intent creation includes:
payment_intent_params['automatic_payment_methods'] = {'enabled': True}
```

### 4. Check Stripe Dashboard Settings

#### A. Apple Pay Domain Verification
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Settings → Apple Pay
2. Add your domain: `esim-f0e3e.web.app` (or your Vercel domain)
3. Download the verification file and upload it to your domain root
4. Verify the domain shows as "Verified"

#### B. Apple Pay Settings
1. Go to Stripe Dashboard → Settings → Apple Pay
2. Ensure "Apple Pay" is enabled
3. Check that your merchant identifier is configured

### 5. Check Apple Developer Console

#### A. Merchant ID Configuration
1. Go to [Apple Developer Console](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Check your Merchant ID: `merchant.theholylabs.com`
4. Ensure it's properly configured and active

#### B. App ID Configuration
1. Check your App ID in Apple Developer Console
2. Ensure "Apple Pay" capability is enabled
3. Ensure "In-App Purchase" capability is enabled (if needed)

### 6. Check iOS App Configuration

#### A. Entitlements File
Check `ios/Runner/Runner.entitlements`:
```xml
<key>com.apple.developer.in-app-payments</key>
<array>
    <string>merchant.theholylabs.com</string>
</array>
```

#### B. Info.plist
Check `ios/Runner/Info.plist` for any Apple Pay related configurations.

### 7. Debug Logs to Check

Run your app and look for these logs:

#### ✅ Good Logs (Apple Pay Should Work):
```
🍎 Running on iOS with proper Stripe configuration, Apple Pay potentially available
🍎 Merchant ID: merchant.theholylabs.com
🍎 Apple Pay availability check: true
🍎 Initializing Apple Pay payment sheet...
🍎 Presenting Apple Pay payment sheet...
```

#### ❌ Problem Logs:
```
❌ Not running on iOS, Apple Pay not available
❌ Stripe not configured, Apple Pay not available
❌ Merchant identifier not set, Apple Pay not available
🍎 Apple Pay availability check: false
```

### 8. Common Issues & Solutions

#### Issue 1: "Apple Pay not available" on iOS
**Solution**: Check device has Apple Pay set up in Wallet app

#### Issue 2: Merchant ID not found
**Solution**: Verify merchant ID in Apple Developer Console and Stripe Dashboard

#### Issue 3: Domain not verified
**Solution**: Complete domain verification in Stripe Dashboard

#### Issue 4: Payment sheet shows only card option
**Solution**: Check that `automatic_payment_methods` is enabled in Firebase function

#### Issue 5: Apple Pay button doesn't appear
**Solution**: 
- Check device compatibility
- Verify Apple Pay is set up
- Check Stripe configuration
- Verify domain is verified

### 9. Testing Checklist

- [ ] Device is iOS with Apple Pay support
- [ ] Apple Pay is set up in Wallet app
- [ ] At least one payment card is added to Apple Pay
- [ ] Stripe is properly configured
- [ ] Merchant ID is set correctly
- [ ] Domain is verified in Stripe Dashboard
- [ ] Apple Pay capability is enabled in Apple Developer Console
- [ ] Firebase function includes `automatic_payment_methods`
- [ ] App logs show Apple Pay as available

### 10. Advanced Debugging

#### A. Test with Stripe Test Cards
Use Stripe's test Apple Pay cards to verify functionality.

#### B. Check Network Connectivity
Ensure device has internet connection for Apple Pay verification.

#### C. Test on Different Devices
Test on multiple iOS devices to isolate device-specific issues.

#### D. Check App Store Review Guidelines
Ensure your app complies with Apple Pay guidelines for App Store approval.

## Still Not Working?

If Apple Pay still doesn't appear after checking all the above:

1. **Contact Stripe Support** with your merchant ID and domain
2. **Check Apple Developer Forums** for similar issues
3. **Test with a minimal Stripe implementation** to isolate the issue
4. **Verify your app is not in TestFlight** (some Apple Pay features are limited in TestFlight)

## Quick Test Command

Run this in your Flutter app to get detailed Apple Pay status:

```dart
// Add this to your app for debugging
final status = await PaymentAbusePreventionService.getAbusePreventionStatus();
print('Payment Status: $status');

final applePayAvailable = await PaymentService().isApplePayAvailable();
print('Apple Pay Available: $applePayAvailable');
```
