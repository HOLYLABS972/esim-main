import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { getBlogPosts } from '../../src/services/blogService';

export const revalidate = 3600;

export const metadata = {
  title: 'Travel Guides for Every Country | RoamJet',
  description:
    'Free travel guides for 200+ countries. Discover top attractions, best restaurants, coffee shops, transport tips, digital nomad info and eSIM plans for every destination.',
  alternates: { canonical: 'https://roamjet.net/travel-guide' },
  openGraph: {
    title: 'Travel Guides for Every Country | RoamJet',
    description:
      'Free travel guides for 200+ countries — attractions, food, tips and eSIM plans.',
    url: 'https://roamjet.net/travel-guide',
    siteName: 'RoamJet',
    type: 'website',
  },
};

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

function toSlug(name) {
  return (
    'travel-guide-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

function parseCountries() {
  try {
    const txt = fs.readFileSync(
      path.join(process.cwd(), 'app/countries.txt'),
      'utf-8'
    );
    const seen = new Set();
    const list = [];
    for (const line of txt.split('\n')) {
      const parts = line.split('\t');
      if (parts.length < 3) continue;
      const name = parts[0].trim();
      const code = parts[2].trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      list.push({ name, code });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export default async function TravelGuidePage() {
  const countries = parseCountries();

  // Fetch published travel guides to know which ones are live
  let publishedSlugs = new Set();
  try {
    const posts = await getBlogPosts('en');
    for (const p of posts) {
      if (p.slug.startsWith('travel-guide-')) publishedSlugs.add(p.slug);
    }
  } catch {
    // show all as links even if we can't check
  }

  // Group countries alphabetically
  const grouped = {};
  for (const c of countries) {
    const letter = c.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  }
  const letters = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-700 to-emerald-500 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-extrabold mb-3">
          Travel Guides for Every Country
        </h1>
        <p className="text-lg text-green-100 max-w-2xl mx-auto">
          In-depth guides covering top attractions, local food, coffee shops,
          digital nomad tips and eSIM connectivity for {countries.length}+
          destinations worldwide.
        </p>
      </div>

      {/* Index */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Quick alphabet nav */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {letters.map((l) => (
            <a
              key={l}
              href={`#letter-${l}`}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-sm font-semibold text-green-700 hover:bg-green-50 transition"
            >
              {l}
            </a>
          ))}
        </div>

        {letters.map((letter) => (
          <section key={letter} id={`letter-${letter}`} className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              {letter}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {grouped[letter].map((c) => {
                const slug = toSlug(c.name);
                const isLive = publishedSlugs.size === 0 || publishedSlugs.has(slug);
                return (
                  <Link
                    key={c.name}
                    href={`/blog/${slug}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                      isLive
                        ? 'bg-white border-gray-200 text-gray-700 hover:border-green-400 hover:text-green-700'
                        : 'bg-gray-100 border-gray-100 text-gray-400 pointer-events-none'
                    }`}
                  >
                    <span className="text-lg leading-none">{getFlag(c.code)}</span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t py-10 px-6 text-center">
        <p className="text-gray-600 mb-4 max-w-xl mx-auto">
          Travel smarter — get an eSIM before you land and skip roaming charges.
        </p>
        <Link
          href="/esim-plans"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition"
        >
          Browse eSIM Plans →
        </Link>
      </div>
    </div>
  );
}
