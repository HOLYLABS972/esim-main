export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;

    console.log('🌐 Fetching global eSIMs from Supabase...');

    const { data: plans, error } = await supabaseAdmin
      .from('dataplans')
      .select('*')
      .eq('enabled', true)
      .order('price', { ascending: true });

    if (error) throw error;

    const globalPlans = (plans || []).filter(plan => {
      const countryCodes = plan.country_codes || [];
      const planType = plan.type || '';
      const planRegion = plan.region || plan.region_slug || '';
      const planName = (plan.name || plan.title || '').toLowerCase();
      return planType === 'global' || planType === 'multi-country' || planRegion === 'global' || countryCodes.length > 10 || planName.includes('global') || planName.includes('worldwide');
    }).slice(0, limit);

    console.log(`✅ Found ${globalPlans.length} global eSIMs`);

    return NextResponse.json({
      success: true,
      plans: globalPlans,
      total: globalPlans.length,
      message: 'Global eSIMs retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching global eSIMs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
