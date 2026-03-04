import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (error) {
    console.error('Error in user orders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
