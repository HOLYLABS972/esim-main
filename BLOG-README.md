# Roamjet Blog System

## Overview
Complete blog system for roamjet.net with SEO-optimized pages, multiple images per post, and comprehensive content.

## Features
- ✅ SSR blog listing page (`/blog`)
- ✅ SSR individual post pages (`/blog/[slug]`)
- ✅ Firebase Firestore backend
- ✅ API endpoint for post creation
- ✅ 9 SEO-optimized travel articles
- ✅ Multiple images per post (Pexels API)
- ✅ Internal and external linking
- ✅ Complete metadata and OpenGraph tags

## Blog Posts Included
1. **Best Things to Do in Thailand 2026** - `/blog/best-things-to-do-thailand-2026`
2. **Top 10 Must-Try Foods in Japan** - `/blog/must-try-foods-japan`
3. **Ultimate Guide to Bali on a Budget** - `/blog/bali-budget-guide`
4. **Best Things to Do in Barcelona** - `/blog/best-things-to-do-barcelona`
5. **Street Food Guide: Vietnam** - `/blog/street-food-guide-vietnam`
6. **Top Greek Islands to Visit** - `/blog/top-greek-islands`
7. **Mexico City: What to Eat and Where** - `/blog/mexico-city-food-guide`
8. **Digital Nomad Guide: Lisbon** - `/blog/digital-nomad-lisbon`
9. **Best Beaches in Turkey 2026** - `/blog/best-beaches-turkey-2026`

## API Usage
Create new blog posts via POST to `/api/blog`:

```bash
curl -X POST https://roamjet.net/api/blog \
  -H "Content-Type: application/json" \
  -H "X-Blog-Key: roamjet-blog-2026" \
  -d '{
    "slug": "test-post",
    "title": "Test Post",
    "excerpt": "This is a test post",
    "content": "<h2>Hello World</h2><p>This is test content.</p>",
    "coverImage": "https://example.com/image.jpg",
    "tags": ["test", "example"],
    "metaDescription": "Test post for the blog"
  }'
```

## Database Schema
```javascript
{
  slug: "string",           // URL slug (unique)
  title: "string",          // Post title
  excerpt: "string",        // Short description
  content: "string",        // HTML content
  coverImage: "string",     // Cover image URL
  images: ["string"],       // Array of additional images
  author: "string",         // Author name
  tags: ["string"],         // Array of tags
  metaDescription: "string", // SEO meta description
  published: "boolean",     // Publication status
  publishedAt: "timestamp", // Publication date
  createdAt: "timestamp",   // Creation date
  updatedAt: "timestamp"    // Last update date
}
```

## Installation

### 1. Install Dependencies
The blog system uses existing Firebase config, no additional dependencies needed.

### 2. Insert Blog Posts
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase (if not already logged in)
firebase login

# Run the insertion script
node insert-blog-posts.js
```

### 3. Firestore Rules
Ensure your Firestore rules allow reading blog posts:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /blog_posts/{document} {
      allow read: if resource.data.published == true;
      allow write: if request.auth != null; // Adjust based on your auth
    }
  }
}
```

## File Structure
```
app/
├── blog/
│   ├── page.jsx              # Blog listing page
│   └── [slug]/
│       └── page.jsx          # Individual post page
├── api/
│   └── blog/
│       └── route.js          # API endpoint
src/
└── services/
    └── blogService.js        # Firebase service functions
blog-posts.json               # All 9 articles ready for insertion
insert-blog-posts.js          # Firestore insertion script
```

## SEO Features
- ✅ Dynamic metadata generation
- ✅ OpenGraph tags for social sharing
- ✅ Twitter Card support
- ✅ Canonical URLs
- ✅ Structured data ready
- ✅ Image alt tags
- ✅ Internal linking strategy
- ✅ External authority links

## Content Strategy
Each article includes:
- **Multiple high-quality images** (3-5 per post) from Pexels
- **Internal cross-linking** between related articles
- **External links** to authoritative sources (tourism boards, official sites)
- **Natural eSIM mentions** with CTAs to roamjet.net
- **Rich media** with captions and alt text
- **Proper heading structure** (H2, H3)
- **Call-to-action** endings

## Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy
npm run deploy
```

## Notes
- All articles are written for 2026 to ensure freshness
- Images are served from Pexels CDN for fast loading
- Internal links use relative paths for proper routing
- External links include `target="_blank"` and `rel="noopener"`
- eSIM mentions are natural and value-focused