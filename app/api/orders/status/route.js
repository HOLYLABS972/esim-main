import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uhpuqiptxcjluwsetoev.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Look up by order_id or id
    const { data, error } = await supabase
      .from('orders')
      .select('id,order_id,status,plan_id,plan_name,customer_email,iccid,qr_code,qr_code_url,smdp_address,activation_code,airalo_order_id,direct_apple_installation_url,country_code,country_name,transaction_id,paddle_transaction_id,amount,currency,created_at,updated_at')
      .or(`order_id.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (error) {
      console.error('Order lookup error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('Order status error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
