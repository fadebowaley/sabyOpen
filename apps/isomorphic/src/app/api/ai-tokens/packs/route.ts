import { NextRequest, NextResponse } from 'next/server';
import { buildInternalApiUrl } from '../../_lib/backend-url';

export async function GET(request: NextRequest) {
  try {
    const upstream = await fetch(buildInternalApiUrl('/ai-tokens/packs'), {
      method: 'GET',
      cache: 'no-store',
    });

    const data: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || data?.error || 'Failed to fetch AI token packs' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch AI token packs' },
      { status: 500 }
    );
  }
}
