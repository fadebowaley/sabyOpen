import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

/**
 * POST /api/saby/approvals/[token]/approve
 * POST /api/saby/approvals/[token]/reject
 *
 * Routes approval decisions to the backend. The action (approve|reject) is
 * read from the request body field `action`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken || (token as any)?.user?.accessToken;
    if (!token || !accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action: 'approve' | 'reject' = body.action === 'reject' ? 'reject' : 'approve';
    const reason: string | null = body.reason || null;

    const approvalToken = params.token;
    const url = buildInternalApiUrl(`/copilot/approvals/${encodeURIComponent(approvalToken)}/${action}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
