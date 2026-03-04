export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit')) || 100;

    console.log('🌍 Fetching regional eSIMs from Supabase...');

    const { data: plans, error } = await supabaseAdmin
      .from('dataplans')
      .select('*')
      .eq('enabled', true)
      .order('price', { ascending: true });

    if (error) throw error;

    const regionalPlans = (plans || []).filter(plan => {
      const countryCodes = plan.country_codes || [];
      const planType = plan.type || '';
      const planRegion = plan.region || plan.region_slug || '';
      const planName = (plan.name || plan.title || '').toLowerCase();
      const isRegional = planType === 'regional' || (planRegion && planRegion !== 'global') ||
        (countryCodes.length >= 2 && countryCodes.length <= 10 && !planName.includes('global')) ||
        ['europe','asia','america','africa','middle east'].some(k => planName.includes(k));
      if (!isRegional) return false;
      if (regionCode) {
        return planRegion?.toLowerCase() === regionCode.toLowerCase() || planName.includes(regionCode.toLowerCase());
      }
      return true;
    }).slice(0, limit);

    console.log(`✅ Found ${regionalPlans.length} regional eSIMs`);

    return NextResponse.json({
      success: true,
      plans: regionalPlans,
      total: regionalPlans.length,
      message: 'Regional eSIMs retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching regional eSIMs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
