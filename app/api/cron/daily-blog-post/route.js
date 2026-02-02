import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🤖 Daily blog post cron job started');

    // Step 1: Generate blog post content
    const generatePostResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-blog-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!generatePostResponse.ok) {
      throw new Error('Failed to generate blog post');
    }

    const postData = await generatePostResponse.json();
    console.log('✅ Blog post generated with placeholder image:', postData.title);

    // Step 2: Send Telegram approval notification
    const sendApprovalResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-telegram-approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        draftId: postData.draftId,
        title: postData.title,
        slug: postData.slug
      })
    });

    if (!sendApprovalResponse.ok) {
      console.warn('⚠️ Failed to send Telegram notification');
    } else {
      console.log('✅ Telegram notification sent');
    }

    // Send summary Telegram notification about cron completion
    await sendTelegramNotification({
      success: true,
      draftId: postData.draftId,
      title: postData.title,
      slug: postData.slug,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Daily blog post generated successfully',
      draftId: postData.draftId,
      title: postData.title
    });

  } catch (error) {
    console.error('❌ Error in daily blog post cron:', error);
    
    // Send Telegram notification for error
    await sendTelegramNotification({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Send Telegram notification about daily blog post generation status
 * Uses environment variables: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
 */
async function sendTelegramNotification({ success, draftId, title, slug, error, timestamp }) {
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
      message = `📝 *Daily Blog Post Generated*\n\n` +
        `📄 Title: ${title || 'N/A'}\n` +
        `🔗 Slug: \`${slug || 'N/A'}\`\n` +
        `🆔 Draft ID: ${draftId || 'N/A'}\n\n` +
        `✅ Post generated and sent for approval\n\n` +
        `🕐 ${new Date(timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} UTC`;
    } else {
      message = `❌ *Daily Blog Post Generation Failed*\n\n` +
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

