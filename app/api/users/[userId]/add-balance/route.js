import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { userId } = params;
    const { amount, description } = await request.json();

    if (!userId) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'Valid amount is required' }, { status: 400 });

    const { data: user, error: userError } = await supabaseAdmin.from('user_profiles').select('*').eq('id', userId).single();
    if (userError || !user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const currentBalance = parseFloat(user.balance || 0);
    const newBalance = currentBalance + parseFloat(amount);

    await supabaseAdmin.from('user_profiles').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', userId);

    // Create transaction record
    try {
      await supabaseAdmin.from('transactions').insert({
        user_id: userId, type: 'deposit', amount: parseFloat(amount),
        balance_before: currentBalance, balance_after: newBalance,
        description: description || 'Admin balance addition',
      });
    } catch (e) { console.error('Error creating transaction:', e); }

    const { data: updatedUser } = await supabaseAdmin.from('user_profiles').select('*').eq('id', userId).single();

    return NextResponse.json({ success: true, user: updatedUser, newBalance, message: `Balance added. New balance: $${newBalance.toFixed(2)}` });
  } catch (error) {
    console.error('Error in add-balance:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
