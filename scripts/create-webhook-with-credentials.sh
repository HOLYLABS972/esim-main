#!/bin/bash

# Lemon Squeezy Webhook Creation Script
# This script creates a webhook using your actual credentials

API_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiIwNjFlYjljOGJjN2Q4NGU5YjYzOTczZGFlMjhkOWE0NjQwYTlmNjMyMjRlMjA3OWY3Y2Q3NDRkOTM1YjhmMGMwNGYyYmQ3Y2NmNzFhZDE4MSIsImlhdCI6MTc2NTE0MDQ4My4wNTM3MjYsIm5iZiI6MTc2NTE0MDQ4My4wNTM3MjksImV4cCI6MjA4MDY3MzI4My4wNDM0NjgsInN1YiI6IjYxMDc4MzgiLCJzY29wZXMiOltdfQ.dPixgGnypbeS2ies07uuhj2X1XnHzwcR3ByufjwouSIbEEFpUc_ns-R5l7UmHsrbZXJQWADh90rVGHYm5vl6PhEJ0yV-pxEiyWTUsMyCzwJe0obSTItDW092oVQwXtJaG9lLTUWdwhgHb5WponpwskkHKp7aqsg6HNDZt-8oHEcb-AdsaHYc0FjB49fosGttM4oB99H9V5PNmraR0Hbxm-KoCrHqkUf-eJE1hC9g3VMUwkb6G1zVTNujt_uVOgqscT8mFzauAIydpMcxlEDZBdvn1knvbmWvwoWk2QeMpxvoJoGRHi_A2GS4F6bOXHUo4chpJI0aA2WWl6eqN2QcAaLc3s8Uylo4EZHgpU2OnDAwTDby_bMnxPPTVELSa-_H0EJZWp7n6fDHBHKmSGIPpioHVjtZ8D3NEX8DNKpomVJ9uvxsfsCVgvlgkSs4kt2Te-wgguipbtIhzhpOeU3qGbS71WHDZZ9NlCUdZwcqFf000JTppmfitLLX0G9EjmB9NfupCIi8_n89TgAgHpNOk_hR5RjD0Zl5YqrQPcBKNTbdLFd0hXK8TwK1M9i8qjVIIGGvDysjPNAlfH7kTGRUi4rWI-Ns4FyedT26B56VC2v9Sew_zkXhjVcqf3cEWEmKmDT9HW64wHseei0FnTt8xot1z-uqALldOR3M4yFii3E"
STORE_ID="253515"
# Webhook secret must be 6-40 characters (Lemon Squeezy requirement)
WEBHOOK_SECRET="a451556ced71e568fcba6423d1ae42fb60d517bc"

# Update this with your actual domain
WEBHOOK_URL="https://yourdomain.com/api/webhooks/lemonsqueezy"

echo "🔄 Creating Lemon Squeezy webhook..."
echo "📋 Store ID: $STORE_ID"
echo "🔗 Webhook URL: $WEBHOOK_URL"
echo "🔐 Secret length: ${#WEBHOOK_SECRET} characters (must be 6-40)"
echo ""

curl -X "POST" "https://api.lemonsqueezy.com/v1/webhooks" \
  -H 'Accept: application/vnd.api+json' \
  -H 'Content-Type: application/vnd.api+json' \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"data\": {
      \"type\": \"webhooks\",
      \"attributes\": {
        \"url\": \"$WEBHOOK_URL\",
        \"events\": [
          \"order_created\",
          \"order_refunded\",
          \"subscription_payment_success\",
          \"subscription_created\",
          \"subscription_updated\",
          \"subscription_cancelled\"
        ],
        \"secret\": \"$WEBHOOK_SECRET\"
      },
      \"relationships\": {
        \"store\": {
          \"data\": {
            \"type\": \"stores\",
            \"id\": \"$STORE_ID\"
          }
        }
      }
    }
  }"

echo ""
echo ""
echo "✅ Done! If successful, you should see the webhook details above."
echo "💡 Next step: Make sure the same webhook_secret is in your Firestore config:"
echo "   Collection: config"
echo "   Document: lemonsqueezy"
echo "   Field: webhook_secret = $WEBHOOK_SECRET"
