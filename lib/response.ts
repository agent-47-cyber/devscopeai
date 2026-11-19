import { NextResponse } from 'next/server';

export const responseBuilder = {
  success<T>(data: T, statusCode = 200): NextResponse {
    return NextResponse.json(data, { status: statusCode });
  },

  successEnvelope<T>(data: T, statusCode = 200, meta?: any): NextResponse {
    const provider = meta?.provider || 'UNKNOWN';
    const executionTime = meta?.executionTime || 0;
    const fallbackUsed = meta?.fallbackUsed || false;
    const source = meta?.source || 'API';

    const body = {
      success: true,
      source,
      provider,
      data,
      analysis: data,
      metadata: meta || {},
      executionTime,
      fallbackUsed,
      error: null
    };
    return NextResponse.json(body, { status: statusCode });
  },

  error(statusCode: number, code: string, message: string, headers?: Record<string, string>): NextResponse {
    const body = {
      success: false,
      source: 'System',
      provider: 'None',
      analysis: null,
      metadata: { timestamp: new Date().toISOString(), code },
      executionTime: 0,
      fallbackUsed: false,
      error: message
    };
    return NextResponse.json(body, { status: statusCode, headers });
  }
};
