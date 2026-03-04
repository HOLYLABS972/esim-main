export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const skip = (page - 1) * limit;

    let query = supabaseAdmin.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (status !== 'all') query = query.eq('status', status);

    const { data: allOrders, error, count } = await query;
    if (error) throw error;

    let orders = allOrders || [];

    if (search) {
      const s = search.toLowerCase();
      orders = orders.filter(o => {
        const email = (o.email || o.user_email || '').toLowerCase();
        const id = (o.id || '').toLowerCase();
        const iccid = (o.iccid || '').toLowerCase();
        return email.includes(s) || id.includes(s) || iccid.includes(s);
      });
    }

    const total = orders.length;
    const paginatedOrders = orders.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });

    const updateData = { updated_at: new Date().toISOString() };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { error } = await supabaseAdmin.from('orders').update(updateData).eq('id', data.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
