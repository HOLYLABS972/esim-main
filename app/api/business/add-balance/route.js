import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { businessId, amount, description } = await request.json();
    if (!businessId) return NextResponse.json({ success: false, error: 'businessId is required' }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'Valid amount is required' }, { status: 400 });

    const { data: user, error } = await supabaseAdmin.from('business_users').select('*').eq('id', businessId).single();
    if (error || !user) return NextResponse.json({ success: false, error: 'Business user not found' }, { status: 404 });

    const currentBalance = user.balance || 0;
    const newBalance = currentBalance + amount;

    await supabaseAdmin.from('business_users').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', businessId);

    await supabaseAdmin.from('billing_transactions').insert({
      user_id: businessId, type: 'deposit', amount, description: description || 'Admin balance addition',
      balance_before: currentBalance, balance_after: newBalance,
    });

    return NextResponse.json({ success: true, newBalance, message: `Balance added. New: $${newBalance.toFixed(2)}` });
  } catch (error) {
    console.error('Error in add-balance:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
