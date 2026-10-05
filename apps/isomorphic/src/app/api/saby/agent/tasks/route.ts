import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

/**
 * GET /api/saby/agent/tasks
 *
 * Proxies to GET /v1/copilot/tasks.
 * Supports query params: status, limit.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken || (token as any)?.user?.accessToken;
    if (!token || !accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    if (searchParams.get('status')) params.set('status', searchParams.get('status')!);
    if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);

    const qs = params.toString();
    const res = await fetch(
      buildInternalApiUrl(`/copilot/tasks${qs ? `?${qs}` : ''}`),
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
