# Deploy Firebase Functions with Airalo Client Secret

## Steps to Deploy

### 1. Set Firebase Project
```bash
firebase use --add
# Select your project: esim-f0e3e
```

### 2. Set Airalo Client Secret
```bash
firebase functions:config:set airalo.client_secret="G1AqJ0US5KIQrbkMbZnjo88ucD0oYH2BZTgRAEKT"
```

### 3. Deploy Functions
```bash
firebase deploy --only functions
```

## Alternative: Use Environment Variables

You can also set the client secret as an environment variable in your Firebase project:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Add environment variable: `AIRALO_CLIENT_SECRET=G1AqJ0US5KIQrbkMbZnjo88ucD0oYH2BZTgRAEKT`

## What's Been Added

### Backend Changes:
- ✅ **config.py**: Added `AIRALO_CLIENT_SECRET` configuration
- ✅ **airalo_api.py**: Updated to load and use client secret
- ✅ **main.py**: Added `save_airalo_client_secret_fn()` function

### Frontend Changes:
- ✅ **AdminDashboard.jsx**: Updated to save client secret to Firestore

## Client Secret Usage

The client secret will be used for:
- Airalo API authentication
- eSIM order processing
- Package validation

## Verification

After deployment, check the Firebase Functions logs to confirm:
- ✅ Airalo client secret loaded successfully
- ✅ Functions deployed without errors
