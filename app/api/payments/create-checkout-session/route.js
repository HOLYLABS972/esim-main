import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Payments are currently unavailable' }, { status: 503 });
}
