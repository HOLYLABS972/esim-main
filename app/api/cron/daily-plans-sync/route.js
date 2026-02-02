import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint for daily automatic plans sync
 * This endpoint should be called by Vercel Cron
 * 
 * Schedule: Daily at 2 AM UTC (0 2 * * *)
 */
export async function GET(request) {
  try {
    // Verify authorization (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Daily plans sync cron job triggered');

    // Check if auto-sync is enabled in configuration
    const configRef = doc(db, 'config', 'auto_sync');
    const configDoc = await getDoc(configRef);
    
    const isEnabled = configDoc.exists() ? (configDoc.data().enabled === true) : false;
    
    if (!isEnabled) {
      console.log('⏸️ Auto-sync is disabled in admin panel. Skipping sync.');
      return NextResponse.json({
        success: false,
        message: 'Auto-sync is disabled',
        enabled: false,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Auto-sync is enabled. Proceeding with sync...');

    // Get base URL for API calls
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : process.env.NEXT_PUBLIC_APP_URL || 'https://admin.roamjet.net';
    
    console.log('🌐 Calling sync API:', `${baseUrl}/api/sync-airalo`);
    
    // Call the sync-airalo endpoint
    const response = await fetch(`${baseUrl}/api/sync-airalo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('📦 Sync result:', result);

    if (result.success) {
      console.log('✅ Daily plans sync completed successfully');
      const stats = {
        packages: result.details?.plans_synced || 0,
        countries: result.details?.countries_synced || 0,
        global: result.details?.global_count || 0,
        regional: result.details?.regional_count || 0,
        other: result.details?.other_count || 0
      };
      console.log('📊 Stats:', stats);
      
      // Send Telegram notification
      await sendTelegramNotification({
        success: true,
        stats: stats,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Daily plans sync completed',
        enabled: true,
        details: result.details,
        timestamp: new Date().toISOString()
      });
    } else {
      const errorMessage = result.error || 'Sync failed';
      
      // Send Telegram notification for error
      await sendTelegramNotification({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('❌ Cron job error:', error);
    
    // Send Telegram notification for error
    await sendTelegramNotification({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        enabled: true, // We tried to run it
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Send Telegram notification about sync status
 * Uses environment variables: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 */
async function sendTelegramNotification({ success, stats, error, timestamp }) {
  try {
    // Get Telegram credentials from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.log('⚠️ Telegram credentials not configured. Skipping notification.');
      console.log('💡 Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel environment variables');
      return;
    }
    
    // Format message based on success/error
    let message;
    if (success) {
      message = `✅ *Daily Plans Sync Completed*\n\n` +
        `📦 Packages: ${stats.packages}\n` +
        `🌍 Countries: ${stats.countries}\n` +
        `🌐 Global: ${stats.global}\n` +
        `🗺️ Regional: ${stats.regional}\n` +
        `📱 Other: ${stats.other}\n\n` +
        `🕐 ${new Date(timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} UTC`;
    } else {
      message = `❌ *Daily Plans Sync Failed*\n\n` +
        `Error: ${error}\n\n` +
        `🕐 ${new Date(timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} UTC`;
    }
    
    // Send message to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    const telegramData = await response.json();
    
    if (!telegramData.ok) {
      console.error('❌ Telegram API error:', telegramData);
      throw new Error(telegramData.description || 'Failed to send Telegram message');
    }
    
    console.log('✅ Telegram notification sent successfully');
  } catch (error) {
    // Don't throw - we don't want Telegram failures to break the cron job
    console.error('⚠️ Failed to send Telegram notification:', error.message);
  }
}

// Also support POST for manual triggers
export async function POST(request) {
  return GET(request);
}

