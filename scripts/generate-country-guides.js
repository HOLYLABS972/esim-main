#!/usr/bin/env node
/**
 * generate-country-guides.js
 *
 * Generates SEO-optimised travel guide blog posts for every country
 * in countries.txt and upserts them into Supabase blog_posts.
 *
 * Usage:
 *   node scripts/generate-country-guides.js               # all countries
 *   node scripts/generate-country-guides.js Ireland       # one country
 *   node scripts/generate-country-guides.js --dry-run     # print first guide only
 *
 * Requires env vars:
 *   ANTHROPIC_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL  (or falls back to hard-coded project URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Lazy-load deps (installed via npm install) ────────────────────────────────
let Anthropic, createClient;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch {
  console.error('❌  @anthropic-ai/sdk not installed. Run: npm install');
  process.exit(1);
}
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch {
  console.error('❌  @supabase/supabase-js not installed. Run: npm install');
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhpuqiptxcjluwsetoev.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const BRAND = 'esim';
const AUTHOR = 'RoamJet Travel Team';
const ROAMJET_BASE = 'https://roamjet.net';

// ── Unsplash source images (no API key needed) ────────────────────────────────
function unsplashImg(query, w = 1200, h = 630) {
  return `https://source.unsplash.com/featured/${w}x${h}/?${encodeURIComponent(query)}`;
}

// ── Parse countries.txt ───────────────────────────────────────────────────────
function parseCountries() {
  const txt = fs.readFileSync(path.join(__dirname, '../app/countries.txt'), 'utf-8');
  const seen = new Set();
  const list = [];
  for (const line of txt.split('\n')) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const name = parts[0].trim();
    const code = parts[2].trim();
    const pkgSlug = parts[3] ? parts[3].split(',')[0].trim() : '';
    if (!name || seen.has(name)) continue;
    seen.add(name);
    list.push({ name, code, pkgSlug });
  }
  return list;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toSlug(name) {
  return (
    'travel-guide-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

function getFlag(code) {
  if (!code || code.length !== 2 || code === 'XX') return '🌍';
  try {
    return String.fromCodePoint(
      ...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0))
    );
  } catch {
    return '🌍';
  }
}

function makeExcerpt(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.slice(0, 200) + (text.length > 200 ? '…' : '');
}

// ── Build Claude prompt ───────────────────────────────────────────────────────
function buildPrompt(country) {
  const flag = getFlag(country.code);
  const shareUrl = country.pkgSlug
    ? `${ROAMJET_BASE}/share-package/${country.pkgSlug}?country=${country.code}&flag=${encodeURIComponent(flag)}`
    : `${ROAMJET_BASE}/esim-plans`;

  return `You are a professional travel writer and SEO expert. Write a comprehensive, long-form travel guide for **${country.name}** designed to rank on Google for searches like:
- "what to do in ${country.name}"
- "best restaurants ${country.name}"
- "${country.name} travel guide"
- "digital nomad ${country.name}"
- "eSIM ${country.name}"

## Rules
- Minimum 1800 words of genuinely useful, specific content
- Use only these HTML tags: h2, h3, p, ul, ol, li, strong, em, a, img
- No divs, no classes, no extra inline styles (except on the img and CTA tags I specify)
- Every recommendation must be real and specific to ${country.name}
- Weave in connectivity/internet tips naturally throughout

## Images — embed these EXACT img tags inside relevant sections:
<img src="${unsplashImg(country.name + ' travel landmark', 1200, 630)}" alt="${country.name} travel guide" loading="lazy" style="width:100%;border-radius:8px;margin:16px 0;" />
<img src="${unsplashImg(country.name + ' local food street', 900, 500)}" alt="Local food in ${country.name}" loading="lazy" style="width:100%;border-radius:8px;margin:16px 0;" />
<img src="${unsplashImg(country.name + ' city architecture', 900, 500)}" alt="${country.name} city" loading="lazy" style="width:100%;border-radius:8px;margin:16px 0;" />
<img src="${unsplashImg(country.name + ' nature scenic', 900, 500)}" alt="${country.name} nature" loading="lazy" style="width:100%;border-radius:8px;margin:16px 0;" />

## Required sections (use h2 for each main section):
1. **Why Visit ${country.name}** — compelling 2–3 paragraph hook; place the first landscape img here
2. **Top Attractions & Things to Do** — at least 6 specific places/activities, each with an h3 heading and 2–3 sentences
3. **Best Restaurants & Local Food** — cuisine overview + 5 specific dish/restaurant recommendations; embed the food img here
4. **Best Coffee Shops & Cafés** — at least 4 café recommendations, highlight which are remote-work friendly
5. **Getting Around ${country.name}** — transport options with rough costs; embed the city img here
6. **Best Time to Visit** — seasons, weather, peak vs shoulder, notable festivals
7. **Practical Tips** — visa requirements, currency, safety rating, local language phrases, tipping etiquette
8. **Digital Nomad Guide to ${country.name}** — internet speed reality, best co-working spaces or neighbourhoods, monthly cost estimate; embed the nature img here
9. **Stay Connected: eSIM for ${country.name}** — explain why bringing an eSIM beats buying a local SIM; end with this exact CTA block:

<div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;margin:28px 0;text-align:center;">
  <p style="font-size:1.15rem;font-weight:700;margin:0 0 6px;">${flag} Get your ${country.name} eSIM from RoamJet</p>
  <p style="color:#374151;margin:0 0 16px;">Instant activation · Works on arrival · No physical SIM needed</p>
  <a href="${shareUrl}" style="background:#16a34a;color:#fff;padding:13px 32px;border-radius:9px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">View ${country.name} eSIM Plans →</a>
</div>

## Output
Return ONLY the raw HTML. Start directly with the first <h2> tag. No markdown, no code fences, no introductory text.`;
}

// ── Generate via Claude ───────────────────────────────────────────────────────
async function generateGuide(client, country) {
  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(country) }],
  });
  return msg.content[0].text.trim();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filterName = args.filter((a) => !a.startsWith('--'))[0];

  if (!ANTHROPIC_KEY) {
    console.error('❌  ANTHROPIC_API_KEY is not set');
    process.exit(1);
  }
  if (!SUPABASE_SERVICE_KEY && !dryRun) {
    console.error('❌  SUPABASE_SERVICE_ROLE_KEY is not set');
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
  const supabase = dryRun ? null : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let countries = parseCountries();
  if (filterName) {
    countries = countries.filter(
      (c) => c.name.toLowerCase() === filterName.toLowerCase()
    );
    if (!countries.length) {
      console.error(`❌  Country "${filterName}" not found in countries.txt`);
      process.exit(1);
    }
  }

  console.log(
    `\n🌍  Generating guides for ${countries.length} countr${countries.length === 1 ? 'y' : 'ies'}${dryRun ? ' (DRY RUN — no DB writes)' : ''}...\n`
  );

  let ok = 0;
  let fail = 0;

  for (const country of countries) {
    const slug = toSlug(country.name);
    process.stdout.write(`  ✍️  ${country.name} → ${slug} … `);

    try {
      const content = await generateGuide(anthropic, country);

      if (dryRun) {
        console.log('\n\n--- DRY RUN OUTPUT (first 2000 chars) ---\n');
        console.log(content.slice(0, 2000));
        console.log('\n[…truncated]\n--- END ---\n');
        return;
      }

      const now = new Date().toISOString();
      const flag = getFlag(country.code);

      const record = {
        slug,
        title: `${flag} ${country.name} Travel Guide: Things to Do, Food, Tips & eSIM`,
        excerpt: makeExcerpt(content),
        content,
        featured_image: `https://source.unsplash.com/featured/1200x630/?${encodeURIComponent(country.name + ' travel')}`,
        author: AUTHOR,
        tags: [
          'travel guide',
          country.name.toLowerCase(),
          'things to do',
          'restaurants',
          'esim',
          'digital nomad',
        ],
        status: 'published',
        brand: BRAND,
        language: 'en',
        seo_description: `Complete ${country.name} travel guide: top attractions, best restaurants, cafés, transport tips, digital nomad info and eSIM plans for ${country.name}.`,
        published_at: now,
        updated_at: now,
      };

      const { error } = await supabase
        .from('blog_posts')
        .upsert(record, { onConflict: 'slug' });

      if (error) {
        console.log(`❌  DB: ${error.message}`);
        fail++;
      } else {
        console.log(`✅`);
        ok++;
      }
    } catch (err) {
      console.log(`❌  ${err.message}`);
      fail++;
    }

    // ~1 req/sec to stay within Claude rate limits
    if (!dryRun) await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n🏁  Done — ${ok} published, ${fail} failed\n`);
  if (ok > 0) {
    console.log(`📌  View index at: https://roamjet.net/travel-guide`);
    console.log(
      `📌  Example post: https://roamjet.net/blog/${toSlug(countries[0].name)}\n`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
