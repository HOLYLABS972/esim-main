import { NextResponse } from 'next/server';

// Stubbed - sync now handled by /api/sync-airalo using Supabase
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request) {
  return NextResponse.json(
    { success: false, error: 'Use /api/sync-airalo instead. This endpoint is deprecated.' },
    { status: 410, headers: corsHeaders }
  );
}
