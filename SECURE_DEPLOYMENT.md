# 🔐 Secure Vercel Deployment Guide

## ⚠️ IMPORTANT: Secrets Security

**NEVER commit secrets to Git!** All sensitive data must be set as environment variables in Vercel.

## 🚀 Deployment Steps

### 1. Prepare Your Code

```bash
# Make sure .env.local is in .gitignore (it already is)
git add .
git commit -m "Prepare for secure deployment"
git push origin main
```

### 2. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Vercel will auto-detect Next.js**

### 3. Set Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

#### 🔥 Firebase Configuration (Public - Safe to expose)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAl456JTQntXJItbXSv8hx1oQ9KW4BGci4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=esim-f0e3e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=esim-f0e3e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=esim-f0e3e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-T0YBW024Z8
```

#### 💳 Stripe Configuration (Public - Safe to expose)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_51LXRaMDoWGog1gVB88ytV8ZVHdl4aZqKA6fImyAKhFPLrxFESftTeqLQIquHH18X2TDQUdbvMLDCRRfgPzeaa0cm00sUIflyfu
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_51LXRaMDoWGog1gVBfrXi6V1ckLsxLckVbXdcWjhh2uI50T7kXK4zqGjU0ONp6mCdOiseceeLjceZiAn4xKCGCvKz00kr7NS4tn
```

#### 🔐 Airalo API Secrets (PRIVATE - Never expose)
```
AIRALO_CLIENT_SECRET_SANDBOX=your_sandbox_client_secret_here
AIRALO_CLIENT_SECRET_PRODUCTION=your_production_client_secret_here
```

#### 🔐 Stripe Secrets (PRIVATE - Never expose)
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_LIVE_SECRET_KEY=sk_live_your_live_stripe_secret_key_here
```

#### 🌐 App Configuration
```
NEXT_PUBLIC_BASE_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_APP_ENV=production
```

## ✅ Security Checklist

- [ ] **No secrets in `vercel.json`** ✅ Fixed
- [ ] **No secrets in code** ✅ All in environment variables
- [ ] **`.env.local` in `.gitignore`** ✅ Already configured
- [ ] **Firebase keys are public** ✅ Safe to expose
- [ ] **Stripe publishable keys are public** ✅ Safe to expose
- [ ] **Airalo secrets are private** ✅ Set as environment variables
- [ ] **Stripe secrets are private** ✅ Set as environment variables

## 🚨 What NOT to Commit

❌ **Never commit these:**
- `.env.local`
- `.env.production.local`
- Any file with `SECRET` or `PRIVATE` in the name
- API keys with `sk_` prefix (Stripe secrets)
- Client secrets from Airalo

✅ **Safe to commit:**
- `NEXT_PUBLIC_*` variables (they're public by design)
- Firebase config (public keys)
- Stripe publishable keys (`pk_` prefix)

## 🔧 Environment Variable Types

### Public Variables (NEXT_PUBLIC_*)
- Available in browser
- Safe to expose
- Used for client-side configuration

### Private Variables (no prefix)
- Only available on server
- Never exposed to browser
- Used for API calls and authentication

## 🚀 Deploy Commands

```bash
# 1. Check what will be committed
git status

# 2. Make sure no secrets are staged
git diff --cached | grep -i secret
git diff --cached | grep -i key
git diff --cached | grep -i private

# 3. If clean, commit and push
git add .
git commit -m "Deploy to Vercel - no secrets"
git push origin main
```

## 🔍 Verify Security

After deployment, check:
1. **View source** of your deployed app
2. **Search for** any API keys or secrets
3. **Should only see** `NEXT_PUBLIC_*` variables
4. **No private keys** should be visible

## 📱 Your App Will Be Live At:
`https://your-app-name.vercel.app`

## 🆘 If You Accidentally Commit Secrets

1. **Immediately rotate** the exposed secrets
2. **Remove from Git history**:
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env.local' --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push**:
   ```bash
   git push origin --force --all
   ```

Your app is now ready for secure deployment! 🎉
