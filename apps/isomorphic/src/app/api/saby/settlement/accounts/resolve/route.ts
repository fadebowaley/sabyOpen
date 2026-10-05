import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../../_lib/backend-url';

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

    const body = await request.json();
    const upstream = await fetch(
      buildInternalApiUrl('/auth/settlement/accounts/resolve'),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body || {}),
      }
    );

    const data: any = await upstream
      .json()
      .catch(() => ({ ok: false, error: 'Invalid account resolve response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.message || data?.error || 'Failed to resolve account',
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to resolve account' },
      { status: 500 }
    );
  }
}
