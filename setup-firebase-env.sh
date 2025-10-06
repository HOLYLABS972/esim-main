#!/bin/bash

# Firebase Environment Setup Script
echo "🔧 Setting up Firebase environment variables..."

# Create .env.local file with Firebase configuration
cat > .env.local << EOL
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAl456JTQntXJItbXSv8hx1oQ9KW4BGci4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=esim-f0e3e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=esim-f0e3e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=esim-f0e3e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=482450515497
NEXT_PUBLIC_FIREBASE_APP_ID=1:482450515497:web:08533fb9536c8e6aa39e38
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-T0YBW024Z8

# Development Environment
NODE_ENV=development
EOL

echo "✅ Created .env.local file with Firebase configuration"
echo "🔄 Please restart your development server for changes to take effect"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To verify Firebase connection:"
echo "  Check the browser console for Firebase initialization messages"
