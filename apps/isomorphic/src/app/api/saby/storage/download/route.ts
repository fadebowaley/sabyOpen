import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const ALLOWED_PREFIXES = ['public/forms/', 'public/uploads/', 'uploads/'];

const normalizeStorageKey = (rawKey: string) => {
  const value = String(rawKey || '').trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    } catch {
      return '';
    }
  }

  return value.replace(/^\/+/, '');
};

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
    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const rawKey =
      request.nextUrl.searchParams.get('key') ||
      request.nextUrl.searchParams.get('url') ||
      '';
    const key = normalizeStorageKey(rawKey);

    if (!key || !ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      return NextResponse.json({ message: 'Invalid storage key' }, { status: 400 });
    }

    const url = new URL(buildInternalApiUrl('/storage/download-by-key'));
    url.searchParams.set('key', key);

    const upstream = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    const payload = (await upstream.json().catch(() => ({}))) as {
      downloadUrl?: string;
      message?: string;
      error?: string;
    };
    if (!upstream.ok) {
      return NextResponse.json(
        {
          message:
            payload?.message || payload?.error || 'Failed to generate download URL',
        },
        { status: upstream.status }
      );
    }

    if (!payload?.downloadUrl) {
      return NextResponse.json(
        { message: 'Download URL was not returned' },
        { status: 502 }
      );
    }

    return NextResponse.redirect(payload.downloadUrl, {
      status: 307,
      headers: {
        'Cache-Control': 'private, max-age=240',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
