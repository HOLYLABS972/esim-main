export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Build an authenticated Google Search Console client.
 * Uses a Service Account with domain-wide delegation.
 *
 * Required env vars:
 *   GSC_SERVICE_ACCOUNT_EMAIL  – service account email
 *   GSC_PRIVATE_KEY            – PEM private key (with \n line breaks)
 *   GSC_SITE_URL               – the verified property URL in GSC (e.g. https://roamjet.net or sc-domain:roamjet.net)
 */
function getSearchConsoleClient() {
  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GSC_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const siteUrl = process.env.GSC_SITE_URL;

  if (!email || !key || !siteUrl) {
    return { client: null, siteUrl: null, error: 'GSC credentials not configured' };
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const client = google.searchconsole({ version: 'v1', auth });
  return { client, siteUrl, error: null };
}

// ─── GET /api/admin/gsc?type=performance|summary|status ───────────────────────

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'status';

    if (type === 'status') {
      return handleStatus();
    }

    if (type === 'summary') {
      return handleSummary(searchParams);
    }

    if (type === 'performance') {
      return handlePerformance(searchParams);
    }

    return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 });
  } catch (error) {
    console.error('[GSC API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── Status check ──────────────────────────────────────────────────────────────

function handleStatus() {
  const { siteUrl, error } = getSearchConsoleClient();

  if (error) {
    return NextResponse.json({ success: true, configured: false, error });
  }

  return NextResponse.json({
    success: true,
    configured: true,
    siteUrl,
  });
}

// ─── Summary (aggregate totals) ────────────────────────────────────────────────

async function handleSummary(searchParams) {
  const { client, siteUrl, error } = getSearchConsoleClient();
  if (error) return NextResponse.json({ success: false, error }, { status: 500 });

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // Current period
  const currentRes = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: [],
    },
  });

  // Previous period (same duration, shifted back)
  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff);

  const prevRes = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
      dimensions: [],
    },
  });

  const current = currentRes.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const previous = prevRes.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  return NextResponse.json({
    success: true,
    current: {
      clicks: current.clicks || 0,
      impressions: current.impressions || 0,
      ctr: current.ctr || 0,
      position: current.position || 0,
    },
    previous: {
      clicks: previous.clicks || 0,
      impressions: previous.impressions || 0,
      ctr: previous.ctr || 0,
      position: previous.position || 0,
    },
    dateRange: { startDate, endDate },
  });
}

// ─── Performance (with dimensions) ─────────────────────────────────────────────

async function handlePerformance(searchParams) {
  const { client, siteUrl, error } = getSearchConsoleClient();
  if (error) return NextResponse.json({ success: false, error }, { status: 500 });

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const dimensions = (searchParams.get('dimensions') || 'query').split(',');
  const rowLimit = parseInt(searchParams.get('rowLimit') || '50');

  const res = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
    },
  });

  const rows = (res.data.rows || []).map(row => ({
    keys: row.keys,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));

  return NextResponse.json({
    success: true,
    rows,
    dimensions,
    rowCount: rows.length,
    dateRange: { startDate, endDate },
  });
}
