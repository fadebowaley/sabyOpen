import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const resolveBase = () => {
  const configured =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_SERVER_URL_BASE ||
    'http://backend:4000/v1';
  const sanitized = trimTrailingSlash(configured);
  return sanitized.endsWith('/v1') ? sanitized : `${sanitized}/v1`;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const accessToken =
      (token as any)?.accessToken || (token as any)?.user?.accessToken;

    if (!token || !accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const input = new URL(request.url);
    const qs = new URLSearchParams();
    const from = input.searchParams.get('from');
    const to = input.searchParams.get('to');
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);

    const path = `/copilot/projects/${encodeURIComponent(projectId)}/scoreboard${
      qs.toString() ? `?${qs.toString()}` : ''
    }`;

    const upstream = await fetch(`${resolveBase()}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ error: 'Invalid scoreboard response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Failed to fetch scoreboard' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
