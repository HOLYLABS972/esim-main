#!/bin/bash

echo "🚀 Deploying Firebase Cloud Functions..."
echo "========================================"

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Error: Not logged into Firebase. Please run 'firebase login' first."
    exit 1
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
cd functions
pip install -r requirements.txt
cd ..

# Deploy functions
echo "🚀 Deploying Cloud Functions..."
firebase deploy --only functions

# Verify deployment
echo "🔍 Verifying function deployment..."
firebase functions:list

echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Test your payment function from the frontend"
echo "2. Check the Firebase console for any deployment errors"
echo "3. If you still see CORS errors, check the function logs:"
echo "   firebase functions:log --only create_payment_intent"
