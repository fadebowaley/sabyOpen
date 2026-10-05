import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../../_lib/backend-url';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectFormId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken || (token as any)?.user?.accessToken;

    if (!token || !accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { projectFormId } = await params;
    if (!projectFormId) {
      return NextResponse.json({ ok: false, error: 'projectFormId is required.' }, { status: 400 });
    }

    const upstream = await fetch(
      buildInternalApiUrl(`/project-forms/${encodeURIComponent(projectFormId)}/delete`),
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data: any = await upstream
      .json()
      .catch(() => ({ message: 'Invalid module delete response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data?.message || data?.error || 'Failed to delete module.' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: data?.message || 'Module deleted successfully.',
      result: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to delete module.' },
      { status: 500 }
    );
  }
}
