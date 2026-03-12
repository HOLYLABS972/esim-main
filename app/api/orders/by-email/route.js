import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = String(searchParams.get('email') || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin is not configured' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders by email lookup error:', error);
      return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 });
    }

    const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
    const orders = (data || []).filter((order) => {
      const candidates = [
        order?.customer_email,
        order?.email,
        order?.user_email,
      ].map(normalizeEmail).filter(Boolean);

      return candidates.some((candidate) => candidate === email);
    }).map((order) => ({
      id: order.id,
      order_id: order.order_id,
      status: order.status,
      plan_id: order.plan_id,
      plan_name: order.plan_name,
      customer_email: order.customer_email || order.email || order.user_email || '',
      iccid: order.iccid,
      qr_code: order.qr_code,
      qr_code_url: order.qr_code_url,
      smdp_address: order.smdp_address,
      activation_code: order.activation_code,
      airalo_order_id: order.airalo_order_id,
      direct_apple_installation_url: order.direct_apple_installation_url,
      country_code: order.country_code,
      country_name: order.country_name,
      amount: order.amount,
      currency: order.currency,
      created_at: order.created_at,
      updated_at: order.updated_at,
    }));

    return NextResponse.json({
      orders,
    });
  } catch (e) {
    console.error('Orders by email error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
