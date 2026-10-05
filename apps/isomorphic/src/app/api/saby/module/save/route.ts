import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { buildInternalApiUrl } from '../../../_lib/backend-url';
import { draftToProjectFormPayload, type ModuleDraftV2 } from '@/app/shared/module-studio-v2';

const bodySchema = z.object({
  draft: z.record(z.any()),
  projectFormId: z.string().trim().optional(),
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

    const draft = parsed.data.draft as ModuleDraftV2;
    const payload = draftToProjectFormPayload(draft);
    // Save draft should remain draft unless explicitly published later.
    payload.metadata = {
      ...(payload.metadata || {}),
      deploymentStatus: 'draft',
      reviewStatus: 'draft',
    };

    const projectFormId = parsed.data.projectFormId
      ? String(parsed.data.projectFormId).trim()
      : '';
    const isUpdate = Boolean(projectFormId);
    const upstream = await fetch(
      buildInternalApiUrl(
        isUpdate ? `/project-forms/${encodeURIComponent(projectFormId)}` : '/project-forms'
      ),
      {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data: any = await upstream
      .json()
      .catch(() => ({ message: 'Invalid project form response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            data?.message ||
            data?.error ||
            (isUpdate ? 'Failed to save module draft.' : 'Failed to create module draft.'),
          payload,
          upstream: data,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json({
      ok: true,
      operation: isUpdate ? 'update' : 'create',
      result: data,
      payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to save module draft.' },
      { status: 500 }
    );
  }
}
