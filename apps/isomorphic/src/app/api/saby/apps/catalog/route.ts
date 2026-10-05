import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const pickArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.apps)) return value.apps;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.results)) return value.data.results;
  if (Array.isArray(value?.data?.apps)) return value.data.apps;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
};

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const accessToken =
      (token as any)?.accessToken || (token as any)?.user?.accessToken || null;

    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const upstream = await fetch(buildInternalApiUrl('/app/catalog'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: payload?.message || payload?.error || 'Failed to load app catalog',
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, results: pickArray(payload) });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load app catalog' },
      { status: 500 }
    );
  }
}
