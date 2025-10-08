# OpenRouter AI Configuration Guide

This document explains how to configure OpenRouter API for AI-generated daily notifications.

## What is OpenRouter?

OpenRouter provides access to multiple AI models (GPT-4, Claude, Llama, Gemini, etc.) through a single API. It's more flexible and often cheaper than using OpenAI directly.

## Configuration Methods

You can configure OpenRouter in two ways:

### Method 1: Firestore Configuration (Recommended - Admin Panel)

In your admin panel's **Config tab**, add a document at `config/openrouter`:

```javascript
{
  api_key: "sk-or-v1-your-api-key-here",
  model: "openai/gpt-3.5-turbo",
  max_tokens: 150,
  temperature: 0.7,
  site_name: "RoamJet",
  site_url: "https://roamjet.com"
}
```

### Method 2: Environment Variables (Alternative)

Add these to your `.env.local` file:

```env
# OpenRouter Configuration
OPENROUTER_API_KEY="sk-or-v1-your-api-key-here"
OPENROUTER_MODEL="openai/gpt-3.5-turbo"
OPENROUTER_MAX_TOKENS="150"
OPENROUTER_TEMPERATURE="0.7"
OPENROUTER_SITE_NAME="RoamJet"
OPENROUTER_SITE_URL="https://roamjet.com"
```

## Getting Your OpenRouter API Key

1. Go to https://openrouter.ai/keys
2. Sign in with Google or create an account
3. Click "Create Key"
4. Copy the key (starts with `sk-or-v1-...`)
5. Add it to your Config tab in Firestore

## Configuration Options

| Option | Description | Default | Required |
|--------|-------------|---------|----------|
| `api_key` | Your OpenRouter API key | - | ✅ Yes |
| `model` | AI model to use | `openai/gpt-3.5-turbo` | No |
| `max_tokens` | Maximum tokens for response | `150` | No |
| `temperature` | Creativity (0-2) | `0.7` | No |
| `site_name` | Your app name | `RoamJet` | No |
| `site_url` | Your app URL | `https://roamjet.com` | No |

## Available Models

### Fast & Cheap (Recommended for notifications)
- `openai/gpt-3.5-turbo` - Fast, reliable, cheap (~$0.002/1K tokens)
- `google/gemini-flash-1.5` - Very fast and cheap (~$0.001/1K tokens)
- `meta-llama/llama-3.1-8b-instruct` - Fast and free!

### High Quality
- `openai/gpt-4-turbo` - Best quality (~$0.01/1K tokens)
- `anthropic/claude-3.5-sonnet` - Excellent reasoning (~$0.015/1K tokens)
- `google/gemini-pro-1.5` - Google's best (~$0.007/1K tokens)

### Free Models
- `meta-llama/llama-3.1-8b-instruct:free` - Completely free!
- `google/gemma-2-9b-it:free` - Free Google model

See all models at: https://openrouter.ai/models

## Usage in Config Service

```javascript
import { configService } from '../services/configService';

// Get OpenRouter configuration
const config = await configService.getOpenRouterConfig();

if (config.apiKey) {
  console.log('OpenRouter configured with model:', config.model);
} else {
  console.error('OpenRouter API key not configured');
}
```

## Security Notes

⚠️ **Important:**
- Store API key in Firestore Config tab (not in code)
- Never commit `.env.local` to Git
- Monitor usage at https://openrouter.ai/activity
- Set spending limits in OpenRouter dashboard
- Rotate keys regularly

## Pricing Comparison

OpenRouter is often cheaper than OpenAI direct:

| Provider | Model | Cost per 1M tokens |
|----------|-------|-------------------|
| OpenRouter | GPT-3.5-Turbo | ~$2.00 |
| OpenRouter | Llama 3.1 8B | FREE |
| OpenRouter | Gemini Flash | ~$1.00 |
| OpenAI Direct | GPT-3.5-Turbo | ~$2.00 |
| OpenAI Direct | GPT-4 | ~$30.00 |

**For 1000 daily notifications:**
- With GPT-3.5: ~$0.20/month
- With Llama 3.1: **FREE**
- With Gemini Flash: ~$0.10/month

## Why OpenRouter?

✅ Access to multiple models (GPT, Claude, Llama, Gemini)  
✅ Often cheaper than going direct  
✅ Free models available  
✅ Single API for all models  
✅ Better rate limits  
✅ Automatic fallbacks

