# Security Setup Guide

This guide explains how to properly set up environment variables and secrets for the eSIM application.

## ⚠️ Important Security Notes

- **NEVER commit actual secrets to git**
- **NEVER push service account keys to any repository**
- Always use environment variables for sensitive data
- Keep your `.env` files local and never share them

## Required Environment Variables

### Backend (Python/Flask)

1. **Google Cloud Service Account Key**
   - Download from Firebase Console → Project Settings → Service Accounts
   - Save as `backend/serviceAccountKey.json`
   - Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

2. **Firebase Configuration**
   - Set in your deployment environment or local `.env` file

### Functions (Firebase Functions)

1. **Stripe API Keys**
   ```bash
   STRIPE_LIVE_SECRET_KEY="sk_live_your_actual_key_here"
   STRIPE_TEST_SECRET_KEY="sk_test_your_actual_key_here"
   ```

2. **Airalo API Keys**
   ```bash
   AIRALO_CLIENT_SECRET_PRODUCTION="your_production_secret_here"
   AIRALO_CLIENT_SECRET_SANDBOX="your_sandbox_secret_here"
   ```

## Setup Instructions

### 1. Local Development

1. Copy the example files:
   ```bash
   cp backend/serviceAccountKey.example.json backend/serviceAccountKey.json
   cp functions/env.example functions/.env
   ```

2. Fill in your actual values in the copied files

3. Never commit the actual `.env` or `serviceAccountKey.json` files

### 2. Production Deployment

1. **Vercel/Netlify**: Set environment variables in your deployment dashboard
2. **Firebase Functions**: Use `firebase functions:config:set` or environment variables
3. **Docker**: Use environment variables or mounted secrets

### 3. Firebase Functions Configuration

```bash
# Set Stripe keys
firebase functions:config:set stripe.live_secret_key="sk_live_..."
firebase functions:config:set stripe.test_secret_key="sk_test_..."

# Set Airalo keys
firebase functions:config:set airalo.production_secret="your_prod_secret"
firebase functions:config:set airalo.sandbox_secret="your_sandbox_secret"
```

## File Structure

```
backend/
├── serviceAccountKey.json          # Your actual service account key (NOT in git)
├── serviceAccountKey.example.json  # Template file (in git)
└── .env                           # Local environment variables (NOT in git)

functions/
├── .env                           # Your actual environment file (NOT in git)
├── env.example                    # Template file (in git)
└── ...
```

## What Was Fixed

1. ✅ Removed `backend/serviceAccountKey.json` from git tracking
2. ✅ Removed `functions/.env.esim-f0e3e` from git tracking
3. ✅ Updated `.gitignore` to prevent future secret commits
4. ✅ Created example files with placeholder values
5. ✅ Added comprehensive security documentation

## Next Steps

1. Set up your actual environment variables locally
2. Configure your production deployment with proper secrets
3. Test that your application works with the new configuration
4. Consider using a secrets management service for production

## Security Best Practices

- Rotate your API keys regularly
- Use different keys for development and production
- Monitor your API usage for suspicious activity
- Never log or expose secrets in error messages
- Use least-privilege access for service accounts
