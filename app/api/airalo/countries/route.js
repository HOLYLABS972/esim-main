export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function DELETE(request) {
  try {
    console.log('🗑️ Deleting all countries and plans from Supabase...');

    const { count: countriesCount } = await supabaseAdmin.from('countries').select('*', { count: 'exact', head: true });
    const { count: plansCount } = await supabaseAdmin.from('dataplans').select('*', { count: 'exact', head: true });

    await supabaseAdmin.from('dataplans').delete().neq('id', '');
    await supabaseAdmin.from('countries').delete().neq('id', '');

    console.log(`✅ Deleted ${countriesCount || 0} countries and ${plansCount || 0} plans`);

    return NextResponse.json({
      success: true,
      message: 'All countries and plans deleted successfully',
      deleted: { countries: countriesCount || 0, packages: plansCount || 0 }
    });
  } catch (error) {
    console.error('❌ Error deleting countries and plans:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit')) || 500;

    console.log('🌍 Fetching countries from Supabase...');

    const { data: countries, error } = await supabaseAdmin
      .from('countries')
      .select('*')
      .limit(limitParam);

    if (error) throw error;

    const formatted = (countries || [])
      .filter(c => c.hidden !== true)
      .map(c => ({
        id: c.id || c.code,
        code: c.code || c.id,
        name: c.name || c.country_name || c.id,
        flag: c.flag || c.flag_url || '',
        flag_url: c.flag || c.flag_url || '',
        is_visible: c.hidden !== true,
        status: c.hidden !== true ? 'active' : 'inactive',
        country_name: c.name || c.country_name || c.id,
        airalo_country_code: c.code || c.id
      }));

    console.log(`✅ Found ${formatted.length} countries`);

    return NextResponse.json({
      success: true,
      countries: formatted,
      total: formatted.length,
      message: 'Countries retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching countries:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
