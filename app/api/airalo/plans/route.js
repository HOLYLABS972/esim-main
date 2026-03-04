export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');
    const limitParam = parseInt(searchParams.get('limit')) || 5000;
    const activeOnly = searchParams.get('active_only') !== 'false';

    console.log('📱 Fetching plans from Supabase...', { countryCode, limit: limitParam, activeOnly });

    let query = supabaseAdmin.from('dataplans').select('*');

    if (activeOnly) {
      query = query.eq('enabled', true).not('hidden', 'eq', true);
    }

    const { data: allPlans, error } = await query.limit(limitParam);
    if (error) throw error;

    let plans = allPlans || [];

    // Filter by country if specified
    if (countryCode) {
      plans = plans.filter(plan => {
        const countryCodes = plan.country_codes || [];
        return countryCodes.includes(countryCode.toUpperCase());
      });
    }

    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      slug: plan.slug || plan.id,
      name: plan.name || plan.title || '',
      title: plan.title || plan.name || '',
      description: plan.description || '',
      price: parseFloat(plan.price) || 0,
      price_usd: parseFloat(plan.price) || 0,
      capacity: parseInt(plan.capacity) || 0,
      data_amount: plan.data_amount || `${plan.capacity || 0}MB`,
      data_amount_mb: parseInt(plan.capacity) || 0,
      period: parseInt(plan.period) || 0,
      validity_days: parseInt(plan.period) || 0,
      operator: plan.operator || '',
      is_active: plan.enabled !== false && plan.hidden !== true,
      status: (plan.enabled !== false && plan.hidden !== true) ? 'active' : 'inactive',
      package_type: plan.type || 'local',
      is_unlimited: plan.is_unlimited || false,
      voice_included: plan.voice_included || false,
      sms_included: plan.sms_included || false,
      country_codes: plan.country_codes || [],
      rechargeability: plan.is_topup ? 'rechargeable' : null,
      is_topup: plan.is_topup || false,
      topups: plan.topups || null,
    }));

    console.log(`✅ Found ${formattedPlans.length} plans`);

    return NextResponse.json({
      success: true,
      plans: formattedPlans,
      total: formattedPlans.length,
      message: 'Plans retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
