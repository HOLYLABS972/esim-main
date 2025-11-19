# Fix Country Codes for Existing Orders

This script will update all existing orders in your Firebase database to have the correct country codes and flags.

## Prerequisites

1. You need your Firebase service account key JSON file
2. Node.js must be installed
3. Firebase Admin SDK must be installed

## Setup

1. **Get your Firebase service account key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the file as `serviceAccountKey.json` in the `esim-main` folder

2. **Install dependencies:**
   ```bash
   cd /Users/admin/Documents/GitHub/esim-main
   npm install firebase-admin
   ```

## Run the Script

```bash
cd /Users/admin/Documents/GitHub/esim-main
node fix-countries.js
```

## What it does

- ✅ Scans all orders in `users/{userId}/esims` collection
- ✅ Scans all orders in global `orders` collection
- ✅ Extracts operator slug from `package_id` (e.g., "giza-mobile-15days-2gb" → "giza-mobile")
- ✅ Maps operator to correct country (e.g., "giza-mobile" → Egypt 🇪🇬)
- ✅ Updates `countryCode` and `countryName` if wrong
- ✅ Shows summary of how many orders were updated

## Example Output

```
🚀 Starting country fix for all orders...

📊 Found 5 users

👤 Processing user: user123
  📱 Found 2 eSIMs

  📦 Order: order-1
     Package: giza-mobile-15days-2gb
     Current country: US (United States)
     ✅ Updated: US → EG (Egypt)

  📦 Order: order-2
     Package: change-7days-1gb
     Current country: US (United States)
     ✅ Country already correct, skipping

================================================================================
📊 SUMMARY
================================================================================
Total orders processed: 10
✅ Updated: 3
⚠️  Skipped: 7
❌ Failed: 0
================================================================================

✅ Country fix complete!
```

## After Running

1. Refresh your dashboard
2. All orders should now show the correct country flags! 🎉

## Note

If you have operators not in the mapping, you'll need to add them to the `operatorCountryMap` object in the script.

