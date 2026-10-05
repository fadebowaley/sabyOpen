import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const pickArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.results)) return value.data.results;
  if (Array.isArray(value?.data?.docs)) return value.data.docs;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
};

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken || (token as any)?.user?.accessToken;

    if (!token || !accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const upstream = await fetch(buildInternalApiUrl('/roles?limit=500&sortBy=name:asc'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ message: 'Invalid roles response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || data?.error || 'Failed to load roles.' },
        { status: upstream.status }
      );
    }

    const roles = pickArray(data)
      .map((role: any) => ({
        id: String(role?._id || role?.id || role?.name || ''),
        name: String(role?.name || role?.roleName || '').trim(),
      }))
      .filter((role: any) => role.id && role.name)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({ ok: true, roles });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load roles.' },
      { status: 500 }
    );
  }
}
