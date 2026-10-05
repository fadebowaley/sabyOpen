import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '../../../_lib/rate-limit';
import { buildInternalApiUrl } from '../../../_lib/backend-url';
import { generateModuleBlueprintViaBackend } from '../_lib/module-blueprint';

const MODULE_BLUEPRINT_LIMIT = 20;
const MODULE_BLUEPRINT_WINDOW_MS = 10 * 60 * 1000;

const bodySchema = z.object({
  brief: z.string().trim().min(5).max(4000),
  section: z.enum(['all', 'fields', 'workflow', 'perm']).optional(),
  existingDraft: z.record(z.any()).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const subject = String(
      token.sub ||
        (token as any)?.user?.id ||
        token.email ||
        getClientIp(request)
    );

    const rate = checkRateLimit(
      `saby-module-blueprint:${subject}`,
      MODULE_BLUEPRINT_LIMIT,
      MODULE_BLUEPRINT_WINDOW_MS
    );

    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rate.retryAfter),
            'X-RateLimit-Limit': String(rate.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    const accessToken =
      (token as any)?.accessToken || (token as any)?.user?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const backendBaseUrl = buildInternalApiUrl('').replace(/\/+$/, '');

    const result = await generateModuleBlueprintViaBackend({
      backendBaseUrl,
      authToken: String(accessToken),
      input: {
        brief: parsed.data.brief,
        section: parsed.data.section || 'all',
        existingDraft: parsed.data.existingDraft || null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rate.limit),
          'X-RateLimit-Remaining': String(rate.remaining),
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Failed to generate module blueprint',
      },
      { status: 500 }
    );
  }
}
