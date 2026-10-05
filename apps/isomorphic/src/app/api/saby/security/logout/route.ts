import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const logoutSchema = z.object({
  scope: z.enum(['current', 'all']).default('current'),
});

const resolveAuthTokens = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return {
    accessToken: (token as any)?.accessToken || (token as any)?.user?.accessToken || null,
    refreshToken: (token as any)?.refreshToken || (token as any)?.user?.refreshToken || null,
  };
};

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await resolveAuthTokens(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = logoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid logout request' }, { status: 400 });
    }

    if (parsed.data.scope === 'current' && !refreshToken) {
      return NextResponse.json(
        { ok: false, error: 'Current refresh token is not available.' },
        { status: 400 }
      );
    }

    const upstream = await fetch(
      buildInternalApiUrl(
        parsed.data.scope === 'all' ? '/auth/sessions/logout-all' : '/auth/logout'
      ),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body:
          parsed.data.scope === 'all'
            ? undefined
            : JSON.stringify({ refreshToken }),
        cache: 'no-store',
      }
    );

    if (!upstream.ok && upstream.status !== 204) {
      const payload = await upstream.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, error: payload?.message || payload?.error || 'Failed to log out' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to log out' },
      { status: 500 }
    );
  }
}
