import { parseAllLogs } from '../../../parser/index.js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const metrics = parseAllLogs();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
