import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const resolveAuthTokens = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return {
    accessToken: (token as any)?.accessToken || (token as any)?.user?.accessToken || null,
    refreshToken: (token as any)?.refreshToken || (token as any)?.user?.refreshToken || null,
  };
};

export async function GET(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await resolveAuthTokens(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(buildInternalApiUrl('/auth/security/overview'));
    if (refreshToken) url.searchParams.set('refreshToken', refreshToken);

    const upstream = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: payload?.message || payload?.error || 'Failed to load security overview' },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ ok: true, ...payload }, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load security overview' },
      { status: 500 }
    );
  }
}
