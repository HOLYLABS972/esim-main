import { NextResponse } from 'next/server';

/**
 * Cron endpoint for daily AI notifications
 * This endpoint should be called by a cron service (Vercel Cron, cron-job.org, etc.)
 * 
 * Schedule examples:
 * - Daily at 10 AM: 0 10 * * *
 * - Every day at 9 AM and 6 PM: 0 9,18 * * *
 * - Monday to Friday at 10 AM: 0 10 * * 1-5
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

    console.log('🤖 Daily notification cron job triggered');

    // Array of prompts for variety - randomly select one
    const dailyPrompts = [
      // Travel Tips
      "Create a short, friendly travel tip about using eSIM for international roaming, under 110 characters",
      "Share an exciting tip about staying connected while traveling abroad with eSIM, under 110 characters",
      "Write a helpful reminder about activating eSIM before traveling, under 110 characters",
      "Create a money-saving tip about international data with eSIM, under 110 characters",
      
      // Engagement
      "Write an engaging message encouraging users to explore new travel destinations, under 110 characters",
      "Create a friendly reminder to check data balance, under 110 characters",
      "Share an inspiring travel quote with eSIM connectivity theme, under 110 characters",
      
      // Benefits
      "Highlight one key benefit of eSIM over physical SIM cards, under 110 characters",
      "Explain why eSIM is perfect for travelers in a fun way, under 110 characters",
      "Share a quick fact about eSIM convenience, under 110 characters",
      
      // Seasonal/Time-based
      "Create a motivational Monday message about travel connectivity, under 110 characters",
      "Write a weekend travel planning reminder with eSIM, under 110 characters",
      "Share a mid-week travel inspiration with connectivity focus, under 110 characters"
    ];

    // Select random prompt
    const randomPrompt = dailyPrompts[Math.floor(Math.random() * dailyPrompts.length)];
    
    console.log('📝 Selected prompt:', randomPrompt);

    // Call the AI notification API
    // Hardcoded URLs for development and production
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://esim.roamjet.net';
    
    console.log('🌐 Calling API:', `${baseUrl}/api/ai-notification`);
    
    const response = await fetch(`${baseUrl}/api/ai-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '💡 Daily Tip from RoamJet',
        prompt: randomPrompt,
        userIds: [] // Send to all users
      })
    });

    console.log('📡 Response status:', response.status, response.statusText);

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text);
      throw new Error(`Expected JSON response, got: ${contentType}`);
    }

    const result = await response.json();
    console.log('📦 Parsed result:', result);

    if (result.success) {
      console.log('✅ Daily notification sent successfully');
      console.log('📊 Stats:', result.sent);
      
      return NextResponse.json({
        success: true,
        message: 'Daily notification sent',
        generated: result.generated,
        stats: result.sent,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(result.error || 'Failed to send notification');
    }

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request) {
  return GET(request);
}

