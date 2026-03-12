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
      .select('id,order_id,status,plan_id,plan_name,customer_email,iccid,qr_code,qr_code_url,smdp_address,activation_code,airalo_order_id,direct_apple_installation_url,country_code,country_name,amount,currency,created_at,updated_at')
      .ilike('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders by email lookup error:', error);
      return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      orders: data || [],
    });
  } catch (e) {
    console.error('Orders by email error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
