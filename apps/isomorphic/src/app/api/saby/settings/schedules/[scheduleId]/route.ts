import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../../_lib/backend-url';

const resolveAccessToken = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
};

type RouteContext = { params: Promise<{ scheduleId: string }> | { scheduleId: string } };

const resolveScheduleId = async (context: RouteContext) => {
  const params = await context.params;
  return params.scheduleId;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const scheduleId = await resolveScheduleId(context);
    const body = await request.json().catch(() => ({}));
    const upstream = await fetch(
      buildInternalApiUrl(`/settings/schedules/${encodeURIComponent(scheduleId)}`),
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    const payload: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: payload?.message || payload?.error || 'Failed to update schedule' },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ ok: true, schedule: payload }, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
    const scheduleId = await resolveScheduleId(context);
    const upstream = await fetch(
      buildInternalApiUrl(`/settings/schedules/${encodeURIComponent(scheduleId)}`),
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!upstream.ok) {
      const payload: any = await upstream.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, error: payload?.message || payload?.error || 'Failed to delete schedule' },
        { status: upstream.status }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
