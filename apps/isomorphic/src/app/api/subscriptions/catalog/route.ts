import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../_lib/backend-url';

const resolveAccessToken = async (request: NextRequest) => {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
};

export async function GET(request: NextRequest) {
  try {
    const accessToken = await resolveAccessToken(request);
    const upstream = await fetch(buildInternalApiUrl('/subscriptions/catalog'), {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = (await upstream.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || data?.error || 'Failed to load catalog' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to load catalog' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const upstream = await fetch(buildInternalApiUrl('/subscriptions/catalog'), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
      cache: 'no-store',
    });

    const data = (await upstream.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || data?.error || 'Failed to update catalog' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to update catalog' },
      { status: 500 }
    );
  }
}
