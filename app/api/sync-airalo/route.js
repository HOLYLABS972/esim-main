import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { getAiraloAccessToken, AIRALO_BASE_URL } from '../../lib/airaloAuth';

function categorizePlan(planData) {
  const countryCodes = planData.country_codes || planData.country_ids || [];
  const planType = (planData.type || '').toLowerCase();
  const planRegion = (planData.region || planData.region_slug || '').toLowerCase();
  const planName = (planData.name || planData.title || '').toLowerCase();
  const planSlug = (planData.slug || planData.id || '').toLowerCase();

  const isGlobal = planType === 'global' || planRegion === 'global' || planSlug === 'global' || planSlug.startsWith('discover');
  const regionalIdentifiers = ['asia','europe','africa','americas','middle-east','oceania','caribbean','latin-america'];
  const isRegional = planType === 'regional' || regionalIdentifiers.includes(planSlug) || regionalIdentifiers.includes(planRegion);

  return isGlobal ? 'global' : isRegional ? 'regional' : 'other';
}

export async function POST(request) {
  try {
    console.log('🔄 Starting Airalo sync via Supabase...');
    const accessToken = await getAiraloAccessToken();

    // Fetch packages from Airalo
    const packagesResponse = await fetch(`${AIRALO_BASE_URL}/v2/packages?limit=500`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
    });

    if (!packagesResponse.ok) {
      throw new Error(`Failed to fetch packages: ${packagesResponse.statusText}`);
    }

    const packagesData = await packagesResponse.json();
    const packages = packagesData.data || [];
    console.log(`📦 Fetched ${packages.length} packages from Airalo`);

    let synced = 0;
    for (const pkg of packages) {
      const imageUrl = typeof pkg.image === 'string' ? pkg.image : (pkg.image?.url ?? pkg.url ?? null);
      const planData = {
        slug: pkg.slug || pkg.id,
        name: pkg.title || pkg.name || '',
        title: pkg.title || pkg.name || '',
        price: parseFloat(pkg.price) || 0,
        capacity: parseInt(pkg.data) || 0,
        period: parseInt(pkg.validity) || 0,
        type: pkg.type || categorizePlan(pkg),
        country_codes: pkg.country_codes || [],
        operator: pkg.operator?.title || '',
        enabled: true,
        hidden: false,
        updated_at: new Date().toISOString(),
        ...(imageUrl && { image_url: imageUrl }),
        ...(pkg.gradient_start && { gradient_start: pkg.gradient_start }),
        ...(pkg.gradient_end && { gradient_end: pkg.gradient_end }),
      };

      const { error } = await supabaseAdmin
        .from('dataplans')
        .upsert(planData, { onConflict: 'slug' });

      if (!error) synced++;
    }

    console.log(`✅ Synced ${synced} plans to Supabase`);
    return NextResponse.json({ success: true, synced, total: packages.length });
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
