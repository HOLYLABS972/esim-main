import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { userId } = params;
    if (!userId) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('user_profiles').update({
      credit_card_status: 'approved',
      kyc_approved: true,
      updated_at: new Date().toISOString()
    }).eq('id', userId);

    if (error) throw error;

    const { data: user } = await supabaseAdmin.from('user_profiles').select('*').eq('id', userId).single();

    return NextResponse.json({ success: true, user, message: 'KYC approved successfully' });
  } catch (error) {
    console.error('Error in approve-kyc:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
