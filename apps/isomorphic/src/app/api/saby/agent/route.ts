import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '../../_lib/rate-limit';

const SABY_CHAT_LIMIT = 40;
const SABY_CHAT_WINDOW_MS = 10 * 60 * 1000;

const referenceSchema = z.object({
  type: z.literal('project_form'),
  projectId: z.string().trim().min(1).max(128),
  projectFormId: z.string().trim().min(1).max(128).nullable().optional(),
  title: z.string().trim().max(200).nullable().optional(),
  workspaceId: z.string().trim().max(128).nullable().optional(),
});

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),

  // Thread continuity
  threadId: z.string().trim().min(1).max(128).nullable().optional(),

  // Situational context — safe to accept from client (non-auth fields)
  activeNodeId: z.string().trim().min(1).max(128).nullable().optional(),

  context: z
    .object({
      helpMode: z.boolean().optional(),
      toolMode: z.string().trim().min(1).max(64).nullable().optional(),
      currentRoute: z.string().trim().max(256).optional(),
      currentModuleId: z.string().trim().max(128).nullable().optional(),
      timezone: z.string().trim().max(64).optional(),
      modelPreference: z.string().trim().min(1).max(64).optional(),
      commandCategory: z.string().trim().min(1).max(64).nullable().optional(),
      references: z.array(referenceSchema).max(5).optional(),
    })
    .optional(),
});

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getCopilotAgentCandidates = () => {
  const configured = [
    process.env.INTERNAL_COPILOT_URL,
    process.env.COPILOT_AGENT_URL,
    process.env.NEXT_PUBLIC_COPILOT_AGENT_URL,
  ].filter((value): value is string => Boolean(value && value.trim()));

  const defaults = ['http://saby-pr-copilot:3334', 'http://localhost:3334'];
  return [...configured, ...defaults].map((value) => trimTrailingSlash(value));
};

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const accessToken =
      (token as any)?.accessToken || (token as any)?.user?.accessToken;

    if (!token || !accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subject = String(
      token.sub ||
        (token as any)?.user?.id ||
        token.email ||
        getClientIp(request)
    );

    const rate = checkRateLimit(
      `saby-agent:${subject}`,
      SABY_CHAT_LIMIT,
      SABY_CHAT_WINDOW_MS
    );

    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
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

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Message is required and must be <= 4000 chars.' },
        { status: 400 }
      );
    }

    // Trusted identity — stamped server-side from the verified JWT, never from client body
    const trustedTenantId = (token as any)?.user?.tenantId || null;
    const trustedUserId =
      (token as any)?.user?.id ||
      (token as any)?.user?.userId ||
      token.sub ||
      null;
    const isSabyUser = Boolean(
      (token as any)?.user?.isSaby ||
      (token as any)?.isSaby ||
      (token as any)?.user?.isSuper ||
      (token as any)?.isSuper ||
      (token as any)?.user?.email === 'mosaby@saby.ai' ||
      trustedTenantId === 'aM8i9MxlR6'
    );
    const isOwnerUser = Boolean(
      (token as any)?.user?.isOwner ||
      (token as any)?.isOwner
    );
    const isAdminUser = Boolean(
      (token as any)?.user?.isAdmin ||
      (token as any)?.isAdmin
    );

    const trustedRole: string = (() => {
      if (isSabyUser) return 'isSaby';
      if (isOwnerUser) return 'owner';
      if (isAdminUser) return 'admin';
      const roles: any[] = (token as any)?.user?.roles || [];
      if (!roles.length) return 'member';
      // Prefer highest-trust role
      const priority = [
        'super',
        'owner',
        'admin',
        'manager',
        'member',
        'viewer',
      ];
      for (const p of priority) {
        const found = roles.find((r: any) =>
          typeof r === 'string'
            ? r.toLowerCase().includes(p)
            : String(r?.name || r?.role || '')
                .toLowerCase()
                .includes(p)
        );
        if (found)
          return typeof found === 'string'
            ? found
            : String(found?.name || found?.role || found);
      }
      const first = roles[0];
      return typeof first === 'string'
        ? first
        : String(first?.name || first?.role || first || 'member');
    })();

    const payload = {
      message: parsed.data.message,
      // Thread memory
      threadId: parsed.data.threadId ?? null,
      // Trusted identity (server-stamped)
      tenantId: trustedTenantId,
      userId: trustedUserId,
      role: trustedRole,
      isSaby: isSabyUser,
      // Situational context
      activeNodeId: parsed.data.activeNodeId ?? null,
      context: {
        ...(parsed.data.context || {}),
        isSaby: isSabyUser,
        role: trustedRole,
      },
    };
    const candidates = getCopilotAgentCandidates();

    let lastError: unknown = null;

    for (const baseUrl of candidates) {
      try {
        const upstream = await fetch(`${baseUrl}/agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-is-saby': isSabyUser ? 'true' : 'false',
            'x-user-role': trustedRole,
          },
          body: JSON.stringify(payload),
        });

        const data: any = await upstream.json().catch(() => ({
          ok: false,
          error: 'Invalid response from Saby agent',
        }));

        if (!upstream.ok) {
          return NextResponse.json(
            {
              ok: false,
              error: data?.error || 'Saby agent request failed',
            },
            { status: upstream.status }
          );
        }

        return NextResponse.json(data, {
          status: 200,
          headers: {
            'X-RateLimit-Limit': String(rate.limit),
            'X-RateLimit-Remaining': String(rate.remaining),
          },
        });
      } catch (error) {
        lastError = error;
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          lastError instanceof Error
            ? lastError.message
            : 'Unable to reach Saby agent service',
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
