import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../../_lib/backend-url';

const resolveAccessToken = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ ok: false, error: 'jobId is required' }, { status: 400 });
    }

    const url = new URL(request.url);
    const params = new URLSearchParams();
    ['includeEvents', 'eventLimit'].forEach((key) => {
      const value = url.searchParams.get(key);
      if (value != null && value !== '') params.set(key, value);
    });

    const query = params.toString();
    const upstream = await fetch(
      buildInternalApiUrl(
        `/copilot/onboarding/jobs/${encodeURIComponent(jobId)}${query ? `?${query}` : ''}`
      ),
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
        { ok: false, error: data?.message || data?.error || 'Failed to load onboarding job' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to load onboarding job' },
      { status: 500 }
    );
  }
}
