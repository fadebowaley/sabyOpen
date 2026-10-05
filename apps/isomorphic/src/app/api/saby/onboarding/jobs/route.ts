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

    const url = new URL(request.url);
    const params = new URLSearchParams();
    ['threadId', 'status', 'limit', 'offset'].forEach((key) => {
      const value = url.searchParams.get(key);
      if (value != null && value !== '') params.set(key, value);
    });

    const upstream = await fetch(
      buildInternalApiUrl(`/copilot/onboarding/jobs?${params.toString()}`),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data: any = await upstream
      .json()
      .catch(() => ({ ok: false, error: 'Invalid onboarding response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || data?.error || 'Failed to load onboarding jobs' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load onboarding jobs' },
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

    const incoming = await request.formData();
    const file = incoming.get('file');
    const mode = String(incoming.get('mode') || 'import');
    const threadId = String(incoming.get('threadId') || '').trim();

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: 'CSV file is required (field: file)' },
        { status: 400 }
      );
    }

    const payload = new FormData();
    payload.append('file', file, (file as any).name || 'onboarding.csv');
    payload.append('mode', mode === 'dry_run' ? 'dry_run' : 'import');
    if (threadId) payload.append('threadId', threadId);

    const upstream = await fetch(buildInternalApiUrl('/copilot/onboarding/jobs'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: payload,
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ ok: false, error: 'Invalid onboarding response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || data?.error || 'Failed to create onboarding job' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to create onboarding job' },
      { status: 500 }
    );
  }
}
