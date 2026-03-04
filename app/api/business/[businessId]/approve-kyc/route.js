import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { businessId } = params;
    if (!businessId) return NextResponse.json({ success: false, error: 'Business ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('business_users').update({
      kyc_status: 'approved',
      kyc_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', businessId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'KYC approved successfully' });
  } catch (error) {
    console.error('❌ Error approving KYC:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
