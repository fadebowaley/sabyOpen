import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const resolveAccessToken = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
};

const allowedActions = new Set(['process', 'complete', 'cancel', 'refund']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { paymentId: string; action: string } }
) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, action } = params;
    const normalizedAction = String(action || '').trim().toLowerCase();
    if (!allowedActions.has(normalizedAction)) {
      return NextResponse.json({ message: 'Unsupported payment action' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const upstream = await fetch(
      buildInternalApiUrl(`/payments/${encodeURIComponent(paymentId)}/${normalizedAction}`),
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body || {}),
        cache: 'no-store',
      }
    );

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { message: data?.message || data?.error || 'Failed to update payment' },
        { status: upstream.status }
      );
    }

    return NextResponse.json(data, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to update payment' },
      { status: 500 }
    );
  }
}
