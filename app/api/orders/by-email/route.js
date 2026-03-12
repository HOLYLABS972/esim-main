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
      .select('id,order_id,status,plan_id,plan_name,customer_email,email,user_email,iccid,qr_code,qr_code_url,smdp_address,activation_code,airalo_order_id,direct_apple_installation_url,country_code,country_name,amount,currency,created_at,updated_at')
      .or(`customer_email.ilike.%${email}%,email.ilike.%${email}%,user_email.ilike.%${email}%`)
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
    }).map(({ email: _email, user_email: _userEmail, ...order }) => order);

    return NextResponse.json({
      orders,
    });
  } catch (e) {
    console.error('Orders by email error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
