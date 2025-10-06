# Facebook Pixel Integration Documentation

## Overview

This project includes a GDPR-compliant Facebook Pixel integration that respects user cookie consent preferences. The Facebook Pixel (ID: `1421838312138067`) only loads and tracks events when users have explicitly consented to marketing cookies.

## How It Works

### 1. Cookie Consent Integration
- The Facebook Pixel is integrated with the existing `CookieConsent` component
- Pixel only loads when users click "Accept All" (consenting to marketing cookies)
- If users click "Reject All", the pixel won't load
- The integration respects GDPR and privacy regulations

### 2. Components Added

#### `FacebookPixel.jsx`
- Main component that handles pixel loading based on consent
- Listens for consent changes and loads/unloads pixel accordingly
- Includes proper error handling and logging

#### `facebookPixel.js` (Utility Functions)
- Helper functions for tracking events throughout the app
- Built-in consent checking before sending any data
- Pre-defined event types and tracking functions

### 3. Integration Points

#### Layout Integration
The `FacebookPixel` component is included in the main layout (`app/layout.jsx`) so it's available on all pages.

#### Checkout Page Example
The checkout page (`app/checkout/CheckoutPageClient.jsx`) includes an example of tracking the `InitiateCheckout` event when users view the checkout page.

## Usage Examples

### Basic Event Tracking

```javascript
import { trackFacebookEvent, FacebookEvents } from '../utils/facebookPixel';

// Track a page view (automatically done by the pixel)
trackFacebookEvent(FacebookEvents.VIEW_CONTENT, {
  content_name: 'eSIM Plan Details',
  content_category: 'eSIM Plans'
});

// Track when user adds item to cart
trackFacebookEvent(FacebookEvents.ADD_TO_CART, {
  value: 29.99,
  currency: 'USD',
  content_ids: ['esim_plan_123'],
  content_type: 'product'
});
```

### E-commerce Tracking

```javascript
import { 
  trackPurchase, 
  trackAddToCart, 
  trackInitiateCheckout 
} from '../utils/facebookPixel';

// Track purchase completion
trackPurchase({
  value: 29.99,
  currency: 'USD',
  content_ids: ['esim_plan_123'],
  content_type: 'product',
  order_id: 'order_456'
});

// Track add to cart
trackAddToCart({
  value: 29.99,
  currency: 'USD',
  content_ids: ['esim_plan_123'],
  content_type: 'product'
});

// Track checkout initiation (already implemented in checkout page)
trackInitiateCheckout({
  value: 29.99,
  currency: 'USD',
  content_ids: ['esim_plan_123'],
  content_type: 'product',
  num_items: 1
});
```

### Lead Generation

```javascript
import { trackLead, trackCompleteRegistration } from '../utils/facebookPixel';

// Track lead generation
trackLead({
  content_name: 'Newsletter Signup',
  value: 0,
  currency: 'USD'
});

// Track user registration
trackCompleteRegistration({
  content_name: 'User Account',
  value: 0,
  currency: 'USD'
});
```

### Custom Events

```javascript
import { trackCustomFacebookEvent } from '../utils/facebookPixel';

// Track custom business events
trackCustomFacebookEvent('eSIM_Activation', {
  country: 'US',
  plan_type: 'unlimited',
  value: 29.99,
  currency: 'USD'
});
```

## Available Event Types

The `FacebookEvents` object includes these predefined events:
- `VIEW_CONTENT`
- `ADD_TO_CART`
- `INITIATE_CHECKOUT`
- `PURCHASE`
- `LEAD`
- `COMPLETE_REGISTRATION`
- `SEARCH`
- `ADD_PAYMENT_INFO`
- `CONTACT`
- And more...

## Privacy Compliance Features

### Consent Checking
All tracking functions automatically check for user consent before sending data:

```javascript
// This will only track if user has consented to marketing cookies
trackFacebookEvent('Purchase', { value: 29.99 });

// Check consent manually
import { hasMarketingConsent } from '../utils/facebookPixel';

if (hasMarketingConsent()) {
  // User has consented, safe to track
}
```

### Logging
- All tracking attempts are logged to the console
- Shows when events are blocked due to lack of consent
- Helps with debugging and compliance verification

### Reset Functionality
For testing purposes, you can reset cookie consent in the browser console:

```javascript
// In browser console
window.resetCookieConsent();
```

## Implementation Guidelines

### 1. Where to Add Tracking

**Page Views**: Automatically tracked by the pixel
**Add to Cart**: On cart/checkout pages when items are added
**Purchase**: On payment success pages
**Lead Generation**: On contact forms, newsletter signups
**Registration**: On successful user registration

### 2. Data to Include

Always include relevant business data:
- `value`: Monetary value when applicable
- `currency`: Currency code (default: 'USD')
- `content_ids`: Array of product/plan IDs
- `content_type`: Usually 'product'
- `content_name`: Human-readable name

### 3. Best Practices

- Only track meaningful business events
- Include accurate value and currency data
- Use consistent content_ids across the customer journey
- Test with browser developer tools to verify events are sent
- Respect user privacy and consent preferences

## Testing

### Browser Developer Tools
1. Open browser developer tools (F12)
2. Go to Network tab
3. Filter by "facebook.com" or "fbevents"
4. Perform actions that should trigger events
5. Verify network requests are sent (only when user has consented)

### Facebook Pixel Helper
Install the Facebook Pixel Helper browser extension to see events in real-time.

### Console Logging
Check browser console for tracking logs:
- ✅ "Facebook Pixel: Tracked event 'Purchase'" (successful tracking)
- ❌ "Facebook Pixel: Event 'Purchase' not tracked - no marketing consent" (blocked due to no consent)

## Configuration

The Facebook Pixel ID is currently hardcoded as `1421838312138067`. To change it:

1. Update the ID in `src/components/FacebookPixel.jsx` (line 36)
2. Update the noscript image URL in the same file (line 80)

For production deployments, consider moving the Pixel ID to environment variables.

## Troubleshooting

### Events Not Tracking
1. Check if user has consented to marketing cookies
2. Verify Facebook Pixel is loaded (check Network tab)
3. Check console for error messages
4. Ensure tracking functions are called after pixel loads

### Privacy Compliance
1. Cookie banner must be shown to users
2. Users must explicitly consent to marketing cookies
3. Pixel should not load without consent
4. All tracking should respect user preferences

## Future Enhancements

Consider adding:
- Environment-based Pixel ID configuration
- More detailed e-commerce tracking
- Custom conversion events
- Integration with Google Analytics for cross-platform tracking
- A/B testing for different tracking strategies


