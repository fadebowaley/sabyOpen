import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const resolveAccessToken = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
};

export async function GET(request: NextRequest) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const upstream = await fetch(buildInternalApiUrl('/settings/schedules'), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const payload: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: payload?.message || payload?.error || 'Failed to load schedules' },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ ok: true, results: payload?.results || [] });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const upstream = await fetch(buildInternalApiUrl('/settings/schedules'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const payload: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: payload?.message || payload?.error || 'Failed to create schedule' },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ ok: true, schedule: payload }, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
