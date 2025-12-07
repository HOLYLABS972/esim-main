# Create Lemon Squeezy Webhook - Ready to Use

## Your Credentials (Already Configured)

- **API Key**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...` ✅
- **Store ID**: `253515` ✅
- **Webhook Secret**: `a451556ced71e568fcba6423d1ae42fb60d517bc` ✅ (40 characters - meets Lemon Squeezy requirement)

## Quick Start - Create Webhook Now

### Option 1: Use the Ready-Made Script

1. **Update the webhook URL** in `scripts/create-webhook-with-credentials.sh`:
   ```bash
   WEBHOOK_URL="https://yourdomain.com/api/webhooks/lemonsqueezy"
   ```
   Replace `yourdomain.com` with your actual domain.

2. **Run the script**:
   ```bash
   ./scripts/create-webhook-with-credentials.sh
   ```

### Option 2: Use curl Directly

Replace `yourdomain.com` with your actual domain, then run:

```bash
curl -X "POST" "https://api.lemonsqueezy.com/v1/webhooks" \
  -H 'Accept: application/vnd.api+json' \
  -H 'Content-Type: application/vnd.api+json' \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiIwNjFlYjljOGJjN2Q4NGU5YjYzOTczZGFlMjhkOWE0NjQwYTlmNjMyMjRlMjA3OWY3Y2Q3NDRkOTM1YjhmMGMwNGYyYmQ3Y2NmNzFhZDE4MSIsImlhdCI6MTc2NTE0MDQ4My4wNTM3MjYsIm5iZiI6MTc2NTE0MDQ4My4wNTM3MjksImV4cCI6MjA4MDY3MzI4My4wNDM0NjgsInN1YiI6IjYxMDc4MzgiLCJzY29wZXMiOltdfQ.dPixgGnypbeS2ies07uuhj2X1XnHzwcR3ByufjwouSIbEEFpUc_ns-R5l7UmHsrbZXJQWADh90rVGHYm5vl6PhEJ0yV-pxEiyWTUsMyCzwJe0obSTItDW092oVQwXtJaG9lLTUWdwhgHb5WponpwskkHKp7aqsg6HNDZt-8oHEcb-AdsaHYc0FjB49fosGttM4oB99H9V5PNmraR0Hbxm-KoCrHqkUf-eJE1hC9g3VMUwkb6G1zVTNujt_uVOgqscT8mFzauAIydpMcxlEDZBdvn1knvbmWvwoWk2QeMpxvoJoGRHi_A2GS4F6bOXHUo4chpJI0aA2WWl6eqN2QcAaLc3s8Uylo4EZHgpU2OnDAwTDby_bMnxPPTVELSa-_H0EJZWp7n6fDHBHKmSGIPpioHVjtZ8D3NEX8DNKpomVJ9uvxsfsCVgvlgkSs4kt2Te-wgguipbtIhzhpOeU3qGbS71WHDZZ9NlCUdZwcqFf000JTppmfitLLX0G9EjmB9NfupCIi8_n89TgAgHpNOk_hR5RjD0Zl5YqrQPcBKNTbdLFd0hXK8TwK1M9i8qjVIIGGvDysjPNAlfH7kTGRUi4rWI-Ns4FyedT26B56VC2v9Sew_zkXhjVcqf3cEWEmKmDT9HW64wHseei0FnTt8xot1z-uqALldOR3M4yFii3E" \
  -d '{
    "data": {
      "type": "webhooks",
      "attributes": {
        "url": "https://yourdomain.com/api/webhooks/lemonsqueezy",
        "events": [
          "order_created",
          "order_refunded",
          "subscription_payment_success",
          "subscription_created",
          "subscription_updated",
          "subscription_cancelled"
        ],
        "secret": "a451556ced71e568fcba6423d1ae42fb60d517bc"
      },
      "relationships": {
        "store": {
          "data": {
            "type": "stores",
            "id": "253515"
          }
        }
      }
    }
  }'
```

## After Creating the Webhook

### 1. Verify in Firestore

Make sure your Firestore config has these exact values:

**Collection:** `config`  
**Document ID:** `lemonsqueezy`

```json
{
  "api_key": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiIwNjFlYjljOGJjN2Q4NGU5YjYzOTczZGFlMjhkOWE0NjQwYTlmNjMyMjRlMjA3OWY3Y2Q3NDRkOTM1YjhmMGMwNGYyYmQ3Y2NmNzFhZDE4MSIsImlhdCI6MTc2NTE0MDQ4My4wNTM3MjYsIm5iZiI6MTc2NTE0MDQ4My4wNTM3MjksImV4cCI6MjA4MDY3MzI4My4wNDM0NjgsInN1YiI6IjYxMDc4MzgiLCJzY29wZXMiOltdfQ.dPixgGnypbeS2ies07uuhj2X1XnHzwcR3ByufjwouSIbEEFpUc_ns-R5l7UmHsrbZXJQWADh90rVGHYm5vl6PhEJ0yV-pxEiyWTUsMyCzwJe0obSTItDW092oVQwXtJaG9lLTUWdwhgHb5WponpwskkHKp7aqsg6HNDZt-8oHEcb-AdsaHYc0FjB49fosGttM4oB99H9V5PNmraR0Hbxm-KoCrHqkUf-eJE1hC9g3VMUwkb6G1zVTNujt_uVOgqscT8mFzauAIydpMcxlEDZBdvn1knvbmWvwoWk2QeMpxvoJoGRHi_A2GS4F6bOXHUo4chpJI0aA2WWl6eqN2QcAaLc3s8Uylo4EZHgpU2OnDAwTDby_bMnxPPTVELSa-_H0EJZWp7n6fDHBHKmSGIPpioHVjtZ8D3NEX8DNKpomVJ9uvxsfsCVgvlgkSs4kt2Te-wgguipbtIhzhpOeU3qGbS71WHDZZ9NlCUdZwcqFf000JTppmfitLLX0G9EjmB9NfupCIi8_n89TgAgHpNOk_hR5RjD0Zl5YqrQPcBKNTbdLFd0hXK8TwK1M9i8qjVIIGGvDysjPNAlfH7kTGRUi4rWI-Ns4FyedT26B56VC2v9Sew_zkXhjVcqf3cEWEmKmDT9HW64wHseei0FnTt8xot1z-uqALldOR3M4yFii3E",
  "store_id": "253515",
  "webhook_secret": "a451556ced71e568fcba6423d1ae42fb60d517bc"
}
```

### 2. Test the Webhook

1. Create a test order through your eSIM app
2. Check the webhook logs in Lemon Squeezy dashboard
3. Verify the order is processed in your Firestore `orders` collection

## Troubleshooting

- **"Invalid signature" error**: Make sure `webhook_secret` in Firestore matches exactly the one in the webhook
- **Webhook not receiving events**: Verify the webhook URL is publicly accessible (not localhost)
- **404 errors**: Check that your webhook endpoint is deployed and accessible
