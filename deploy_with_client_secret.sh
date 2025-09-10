#!/bin/bash

# Deploy Firebase Functions with Airalo Client Secret
# This script sets the client secret and deploys the functions

echo "🚀 Deploying Firebase Functions with Airalo Client Secret..."

# Set the Airalo client secret
echo "📝 Setting Airalo client secret..."
firebase functions:config:set airalo.client_secret="G1AqJ0US5KIQrbkMbZnjo88ucD0oYH2BZTgRAEKT"

# Deploy the functions
echo "🚀 Deploying Firebase Functions..."
firebase deploy --only functions

echo "✅ Deployment complete!"
echo "🔑 Airalo client secret has been set and functions deployed"
