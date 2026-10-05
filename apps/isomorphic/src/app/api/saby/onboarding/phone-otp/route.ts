import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const resolveAccessToken = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
};

export async function POST(request: NextRequest) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: 'send' | 'verify';
      phoneNumber?: string;
      otp?: string;
    };

    const action = String(body?.action || '').toLowerCase();
    const endpoint =
      action === 'verify'
        ? '/auth/onboarding/phone-otp/verify'
        : action === 'send'
          ? '/auth/onboarding/phone-otp/send'
          : null;

    if (!endpoint) {
      return NextResponse.json(
        { ok: false, error: 'Invalid action. Use "send" or "verify".' },
        { status: 400 }
      );
    }

    const requestBody =
      action === 'verify'
        ? {
            phoneNumber: body?.phoneNumber || '',
            otp: body?.otp || '',
          }
        : {
            phoneNumber: body?.phoneNumber || '',
          };

    const upstream = await fetch(buildInternalApiUrl(endpoint), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ ok: false, error: 'Invalid onboarding phone OTP response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data?.message || data?.error || 'Failed to process onboarding phone OTP request',
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, data }, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to process onboarding phone OTP request' },
      { status: 500 }
    );
  }
}
