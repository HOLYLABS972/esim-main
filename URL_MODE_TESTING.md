# URL Mode Testing Guide

## How to Test URL Mode Switching

### 1. Test Mode Override
Add `?mode=test` to any URL to force test mode:

**Examples:**
- `http://localhost:3000/share-package/pilatus-mobile-in-7days-1gb?mode=test&country=CH&flag=%F0%9F%87%A8%F0%9F%87%AD`
- `http://localhost:3000/esim-plans?mode=test`
- `http://localhost:3000/dashboard?mode=test`

### 2. Production Mode Override
Add `?mode=production` to any URL to force production mode:

**Examples:**
- `http://localhost:3000/share-package/pilatus-mobile-in-7days-1gb?mode=production&country=CH&flag=%F0%9F%87%A8%F0%9F%87%AD`
- `http://localhost:3000/esim-plans?mode=production`

### 3. What You Should See

#### In Test Mode (`?mode=test`):
- 🟡 **Yellow "TEST" badge** in header
- 🔵 **Blue "URL PARAMS" badge** if country/flag params present
- Console logs: `🌐 URL mode override detected: test`
- All payments use test Stripe keys
- All orders create mock data (no real Airalo calls)

#### In Production Mode (`?mode=production`):
- 🟢 **Green "PRODUCTION" badge** in header
- 🔵 **Blue "URL PARAMS" badge** if country/flag params present
- Console logs: `🌐 URL mode override detected: production`
- All payments use live Stripe keys
- All orders create real Airalo purchases

### 4. Testing Steps

1. **Open browser console** (F12)
2. **Navigate to test URL:**
   ```
   http://localhost:3000/share-package/pilatus-mobile-in-7days-1gb?mode=test&country=CH&flag=%F0%9F%87%A8%F0%9F%87%AD
   ```
3. **Check console logs** for:
   ```
   🌐 URL mode override detected: test
   🌐 URL parameters detected: {country: "CH", flag: "🇨🇭", mode: "test"}
   ```
4. **Verify badges** show:
   - 🟡 "TEST" badge
   - 🔵 "URL PARAMS" badge
5. **Make a test purchase** and verify:
   - Uses test Stripe key
   - Creates mock order (check business dashboard)
   - No real Airalo API call

### 5. Valid Mode Values

- `test` - Test/sandbox mode
- `sandbox` - Same as test
- `live` - Production mode
- `production` - Same as live

### 6. URL Parameter Priority

URL parameters override all other settings:
1. **URL `?mode=`** (highest priority)
2. Firestore config
3. localStorage
4. Default (test)

### 7. Business Dashboard Verification

After making a test purchase with `?mode=test`:
1. Go to business dashboard (`esim-biz`)
2. Check "All Orders" tab
3. Verify test order appears with:
   - 🧪 "Test Order" label
   - $0.00 amount
   - Yellow "sandbox" badge

## Troubleshooting

### Issue: Mode not changing
**Solution:** Check console for errors, ensure URL parameter is spelled correctly

### Issue: Badges not showing
**Solution:** Refresh page, check if `environmentMode` state is set

### Issue: Still using wrong Stripe key
**Solution:** Clear browser cache, check console logs for mode detection

## Example URLs for Testing

```bash
# Test mode with Swiss package
http://localhost:3000/share-package/pilatus-mobile-in-7days-1gb?mode=test&country=CH&flag=%F0%9F%87%A8%F0%9F%87%AD

# Production mode with Swiss package  
http://localhost:3000/share-package/pilatus-mobile-in-7days-1gb?mode=production&country=CH&flag=%F0%9F%87%A8%F0%9F%87%AD

# Test mode on plans page
http://localhost:3000/esim-plans?mode=test

# Production mode on dashboard
http://localhost:3000/dashboard?mode=production
```
