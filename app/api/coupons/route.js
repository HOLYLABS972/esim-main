export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false });

    const { data: coupons, error } = await query;
    if (error) throw error;

    let filtered = coupons || [];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => (c.code || '').toLowerCase().includes(s) || (c.description || '').toLowerCase().includes(s));
    }

    return NextResponse.json({ success: true, coupons: filtered, total: filtered.length });
  } catch (error) {
    console.error('❌ Error fetching coupons:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.code || !data.discount_value) {
      return NextResponse.json({ success: false, error: 'Code and discount value are required' }, { status: 400 });
    }

    // Check duplicate
    const { data: existing } = await supabaseAdmin.from('coupons').select('id').eq('code', data.code).limit(1);
    if (existing?.length) {
      return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 400 });
    }

    const couponData = {
      code: data.code,
      discount_type: data.discount_type || 'percentage',
      discount_value: parseFloat(data.discount_value),
      valid_from: data.valid_from || new Date().toISOString(),
      valid_until: data.valid_until || null,
      max_uses: data.max_uses ? parseInt(data.max_uses) : null,
      current_uses: 0,
      max_uses_per_user: data.max_uses_per_user ? parseInt(data.max_uses_per_user) : 1,
      min_purchase_amount: data.min_purchase_amount ? parseFloat(data.min_purchase_amount) : 0,
      is_active: data.is_active !== false,
      description: data.description || '',
    };

    const { data: newCoupon, error } = await supabaseAdmin.from('coupons').insert(couponData).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error('❌ Error creating coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ success: false, error: 'Coupon ID is required' }, { status: 400 });

    const updateData = { updated_at: new Date().toISOString() };
    const fields = ['code','discount_type','discount_value','valid_from','valid_until','max_uses','max_uses_per_user','min_purchase_amount','is_active','description'];
    fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

    const { error } = await supabaseAdmin.from('coupons').update(updateData).eq('id', data.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('❌ Error updating coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Coupon ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
