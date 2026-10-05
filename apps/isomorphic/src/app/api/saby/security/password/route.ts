import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const resolveAccessToken = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
};

export async function POST(request: NextRequest) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Current password and a valid new password are required.' },
        { status: 400 }
      );
    }

    const upstream = await fetch(buildInternalApiUrl('/auth/change-password-authenticated'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });

    const payload = await upstream
      .json()
      .catch(() => ({ message: upstream.ok ? 'Password updated.' : 'Invalid password response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: payload?.message || payload?.error || 'Failed to update password' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, data: payload }, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
