import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Daily plans sync cron job triggered');

    // Check if auto-sync is enabled
    const { data: config } = await supabaseAdmin.from('config').select('*').eq('key', 'auto_sync').single();
    const isEnabled = config?.value?.enabled === true;

    if (!isEnabled) {
      return NextResponse.json({ success: false, message: 'Auto-sync is disabled', enabled: false });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.roamjet.net';
    const syncResponse = await fetch(`${baseUrl}/api/sync-airalo`, { method: 'POST' });
    const syncResult = await syncResponse.json();

    return NextResponse.json({ success: true, syncResult, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('❌ Cron sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
