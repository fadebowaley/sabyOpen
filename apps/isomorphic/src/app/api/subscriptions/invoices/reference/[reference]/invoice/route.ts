import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../../../_lib/backend-url';

const resolveAccessToken = async (request: NextRequest) => {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await context.params;
    const upstream = await fetch(
      buildInternalApiUrl(`/payments/reference/${encodeURIComponent(reference)}/invoice`),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }
    );

    const content = await upstream.arrayBuffer();
    if (!upstream.ok) {
      return NextResponse.json(
        { message: Buffer.from(content).toString('utf8') || 'Failed to download invoice' },
        { status: upstream.status }
      );
    }

    return new NextResponse(content, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/pdf',
        'Content-Disposition':
          upstream.headers.get('content-disposition') ||
          `attachment; filename="saby-invoice-${reference}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to download invoice' },
      { status: 500 }
    );
  }
}
