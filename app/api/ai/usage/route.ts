import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      used: 0,
      limit: 100,
      resetDate: new Date(Date.now() + 86400000).toISOString()
    }
  });
}
