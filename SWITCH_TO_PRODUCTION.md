# Quick Guide: Switch from Sandbox to Production

## ⚡ Easiest Method: Update Firestore Directly (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** (in the left sidebar)
4. Find or create the document at path: `config/stripe`
   
   **If the document exists:**
   - Click on the `config` collection
   - Click on the `stripe` document
   - Find the `mode` field (or add it if it doesn't exist)
   - Change the value from `sandbox` or `test` to `production`
   - Click **Update**
   
   **If the document doesn't exist:**
   - Click "Start collection" (or "Add collection" if you have collections)
   - Collection ID: `config`
   - Click "Next"
   - Document ID: `stripe`
   - Click "Next"
   - Add a field:
     - **Field name**: `mode`
     - **Field type**: `string`
     - **Field value**: `production`
   - Click **Save**

5. **Done!** Refresh your app to see the changes.

## Method 2: Browser Console (Quick Alternative)

If you prefer to do it from your browser:

1. Open your app in the browser
2. Open Developer Console (F12 or Cmd+Option+I / Ctrl+Shift+I)
3. Make sure you're logged in and have Firebase access
4. Paste and run this code:

```javascript
// This uses your app's Firebase instance
const { doc, setDoc, getDoc } = await import('firebase/firestore');
const { db } = await import('./src/firebase/config');

const configRef = doc(db, 'config', 'stripe');
const current = await getDoc(configRef);
await setDoc(configRef, { 
  ...(current.exists() ? current.data() : {}), 
  mode: 'production' 
}, { merge: true });

console.log('✅ Switched to production! Refresh the page.');
```

## Method 3: Using the Script

1. Make sure you have Firebase Admin credentials configured
2. Set environment variable (if needed):
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```
3. Run the script:
   ```bash
   node scripts/switch-stripe-mode.js production
   ```

## Method 4: URL Parameter (Temporary Test)

Add `?mode=production` to your URL:
```
https://yourdomain.com/?mode=production
```

⚠️ **Note**: This only works for that specific page load and doesn't persist.

## After Switching

1. **Refresh your browser** to reload Stripe with the new mode
2. **Check browser console** for confirmation:
   - `✅ Stripe mode loaded from Firestore: production`
   - `🔑 Loading Stripe in PRODUCTION mode`
   - `🔑 Using LIVE publishable key...`

3. **Verify in Vercel**:
   - Make sure you have production Stripe keys set in environment variables
   - Check that `STRIPE_SECRET_KEY` or `STRIPE_LIVE_SECRET_KEY` is set for Production environment

## Important: Production Keys Required

Before switching to production, make sure you have:

✅ **Production Publishable Key** (`pk_live_...`) set in:
   - Firestore: `config/stripe` → `livePublishableKey` or `live_publishable_key`
   - OR Vercel: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`

✅ **Production Secret Key** (`sk_live_...`) set in:
   - Vercel: `STRIPE_SECRET_KEY` (from Stripe integration - recommended)
   - OR Vercel: `STRIPE_LIVE_SECRET_KEY`

See `STRIPE_PRODUCTION_SETUP.md` for complete setup instructions.

## Troubleshooting

### Still showing sandbox mode?
1. Clear browser localStorage: `localStorage.removeItem('esim_stripe_mode')`
2. Check URL doesn't have `?mode=sandbox` parameter
3. Verify Firestore document `config/stripe` has `mode: "production"`
4. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Payment fails?
- Make sure production Stripe keys are set in Vercel
- Verify keys are from Stripe Dashboard in **Live mode** (not Test mode)
- Check Vercel function logs for errors
