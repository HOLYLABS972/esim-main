export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const skip = (page - 1) * limit;

    let query = supabaseAdmin.from('user_profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (role !== 'all') query = query.eq('role', role);

    const { data: users, error, count } = await query;
    if (error) throw error;

    let filtered = users || [];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(u => {
        const email = (u.email || '').toLowerCase();
        const name = (u.name || u.display_name || u.full_name || '').toLowerCase();
        return email.includes(s) || name.includes(s);
      });
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      users: paginated,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });

    const updateData = { updated_at: new Date().toISOString() };
    ['email','name','display_name','phone','role','is_active','balance'].forEach(f => {
      if (data[f] !== undefined) updateData[f] = data[f];
    });

    const { error } = await supabaseAdmin.from('user_profiles').update(updateData).eq('id', data.id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });

    await supabaseAdmin.from('user_profiles').delete().eq('id', id);

    // Also delete from Supabase auth
    try { await supabaseAdmin.auth.admin.deleteUser(id); } catch (e) { console.warn('Could not delete auth user:', e.message); }

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
