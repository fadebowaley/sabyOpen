import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { buildInternalApiUrl } from '../../../_lib/backend-url';
import {
  draftToProjectFormPayload,
  lintDraftForSubmission,
  type ModuleDraftV2,
} from '@/app/shared/module-studio-v2';

const bodySchema = z.object({
  draft: z.record(z.any()),
  dryRun: z.boolean().optional(),
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
    const lint = lintDraftForSubmission(draft);
    const payload = draftToProjectFormPayload(draft);

    if (lint.blockers.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Module draft is not ready for submission.',
          lint,
          payload,
        },
        { status: 400 }
      );
    }

    if (parsed.data.dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        lint,
        payload,
      });
    }

    const projectFormId = parsed.data.projectFormId
      ? String(parsed.data.projectFormId).trim()
      : '';
    const isUpdate = Boolean(projectFormId);
    payload.metadata = {
      ...(payload.metadata || {}),
      deploymentStatus: 'draft',
      reviewStatus: 'approved',
    };
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
            (isUpdate ? 'Failed to update project form.' : 'Failed to create project form.'),
          lint,
          payload,
          upstream: data,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json({
      ok: true,
      operation: isUpdate ? 'update' : 'create',
      lint,
      payload,
      result: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Failed to submit module.',
      },
      { status: 500 }
    );
  }
}
