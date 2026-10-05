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

    const upstream = await fetch(buildInternalApiUrl('/auth/onboarding/profile'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ ok: false, error: 'Invalid onboarding profile response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || data?.error || 'Failed to load onboarding profile' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load onboarding profile' },
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

    const body = await request.json();
    const upstream = await fetch(buildInternalApiUrl('/auth/onboarding/profile'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ ok: false, error: 'Invalid onboarding profile response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || data?.error || 'Failed to save onboarding profile' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, data }, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to save onboarding profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const upstream = await fetch(buildInternalApiUrl('/auth/onboarding/profile/draft'), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ ok: false, error: 'Invalid onboarding draft response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || data?.error || 'Failed to save onboarding draft' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, data }, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to save onboarding draft' },
      { status: 500 }
    );
  }
}
