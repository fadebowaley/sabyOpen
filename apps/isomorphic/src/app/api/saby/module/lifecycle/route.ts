import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

const bodySchema = z.object({
  projectFormId: z.string().trim().min(1),
  action: z.enum(['submit_review', 'approve', 'publish', 'archive']),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken || (token as any)?.user?.accessToken;
    if (!token || !accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const { projectFormId, action } = parsed.data;
    let upstreamUrl = '';
    let method: 'PATCH' = 'PATCH';
    let body: any = undefined;

    if (action === 'publish') {
      upstreamUrl = buildInternalApiUrl(
        `/project-forms/${encodeURIComponent(projectFormId)}/publish`
      );
    } else if (action === 'archive') {
      upstreamUrl = buildInternalApiUrl(
        `/project-forms/${encodeURIComponent(projectFormId)}/archive`
      );
    } else if (action === 'submit_review') {
      upstreamUrl = buildInternalApiUrl(`/project-forms/${encodeURIComponent(projectFormId)}`);
      body = {
        metadata: {
          deploymentStatus: 'draft',
          reviewStatus: 'in_review',
        },
      };
    } else if (action === 'approve') {
      upstreamUrl = buildInternalApiUrl(`/project-forms/${encodeURIComponent(projectFormId)}`);
      body = {
        metadata: {
          deploymentStatus: 'draft',
          reviewStatus: 'approved',
        },
      };
    }

    const upstream = await fetch(upstreamUrl, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ message: 'Invalid lifecycle response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.message || data?.error || `Failed to ${action}.`,
          upstream: data,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json({
      ok: true,
      action,
      result: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to apply lifecycle action.' },
      { status: 500 }
    );
  }
}

