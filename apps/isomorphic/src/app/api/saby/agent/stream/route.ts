import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '../../../_lib/rate-limit';

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
  threadId: z.string().trim().min(1).max(128).nullable().optional(),
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

/**
 * POST /api/saby/agent/stream
 *
 * Server-Sent Events (SSE) proxy to the saby-copilot /agent/stream endpoint.
 * The copilot streams:
 *   event: progress  — stage changes (thinking, routing, intent, tools, synthesis)
 *   event: token     — individual LLM synthesis tokens  { chunk: string }
 *   event: done      — final { ok, answer, route, toolResults }
 *   event: error     — { error: string }
 *
 * Auth and rate-limiting mirror the non-streaming /agent route.
 * Identity (tenantId, userId, role) is stamped server-side from the JWT.
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const accessToken =
      (token as any)?.accessToken || (token as any)?.user?.accessToken;

    if (!token || !accessToken) {
      return new NextResponse(
        'event: error\ndata: {"error":"Unauthorized"}\n\n',
        { status: 401, headers: { 'Content-Type': 'text/event-stream' } }
      );
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
      return new NextResponse(
        `event: error\ndata: ${JSON.stringify({ error: 'Too many requests. Please try again later.' })}\n\n`,
        {
          status: 429,
          headers: {
            'Content-Type': 'text/event-stream',
            'Retry-After': String(rate.retryAfter),
          },
        }
      );
    }

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return new NextResponse(
        'event: error\ndata: {"error":"Message is required and must be <= 4000 chars."}\n\n',
        { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    // Trusted identity — stamped server-side strictly from the verified JWT
    const trustedTenantId = (token as any)?.user?.tenantId || null;
    const trustedUserId =
      (token as any)?.user?.id ||
      (token as any)?.user?.userId ||
      token.sub ||
      null;

    if (!trustedTenantId || !trustedUserId) {
      return new NextResponse(
        'event: error\ndata: {"error":"Invalid tenant or user session"}\n\n',
        { status: 401, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

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
      threadId: parsed.data.threadId ?? null,
      tenantId: trustedTenantId,
      userId: trustedUserId,
      role: trustedRole,
      isSaby: isSabyUser,
      activeNodeId: parsed.data.activeNodeId ?? null,
      context: {
        ...(parsed.data.context || {}),
        isSaby: isSabyUser,
        role: trustedRole,
      },
    };

    const backendBase = process.env.NEXT_SERVER_URL_BASE
      ? trimTrailingSlash(process.env.NEXT_SERVER_URL_BASE)
      : 'http://backend:4000/v1';

    // 1. If user is authenticated, attempt Governed Saby Agent Engine via sabyBackend
    if (accessToken) {
      try {
        const model = parsed.data.context?.modelPreference || null;
        const backendChatRes = await fetch(`${backendBase}/agent/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            message: parsed.data.message,
            threadId: parsed.data.threadId ?? null,
            model,
          }),
        });

        if (backendChatRes.ok && backendChatRes.body) {
          return new NextResponse(backendChatRes.body, {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              Connection: 'keep-alive',
              'X-Accel-Buffering': 'no',
              'X-RateLimit-Limit': String(rate.limit),
              'X-RateLimit-Remaining': String(rate.remaining),
            },
          });
        }

        if (!backendChatRes.ok && backendChatRes.status === 402) {
          const errData: any = await backendChatRes.json().catch(() => ({}));
          const errMsg =
            errData.message ||
            'Insufficient AI token quota. Please top up your AI token balance.';
          return new NextResponse(
            `event: error\ndata: ${JSON.stringify({
              error: errMsg,
              code: errData.code || 'insufficient_quota',
              billingUrl: '/billing?tab=ai-tokens',
            })}\n\n`,
            {
              status: 200,
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
              },
            }
          );
        }
      } catch (networkErr: any) {
        console.warn('[AgentStreamRoute] Backend /agent/chat bypass, streaming via copilot agent directly');
      }
    }

    // 2. Fallback: Legacy copilot candidate loop
    const candidates = getCopilotAgentCandidates();
    let lastError: unknown = null;

    for (const baseUrl of candidates) {
      try {
        const upstream = await fetch(`${baseUrl}/agent/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-is-saby': isSabyUser ? 'true' : 'false',
            'x-user-role': trustedRole,
            // Tell the copilot agent to keep the SSE connection open
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(payload),
        });

        if (!upstream.ok || !upstream.body) {
          const errText = await upstream.text().catch(() => 'Stream failed');
          return new NextResponse(
            `event: error\ndata: ${JSON.stringify({ error: errText })}\n\n`,
            {
              status: upstream.status,
              headers: { 'Content-Type': 'text/event-stream' },
            }
          );
        }

        // Pipe the upstream SSE stream directly to the client.
        // Next.js App Router supports ReadableStream responses natively.
        return new NextResponse(upstream.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
            'X-RateLimit-Limit': String(rate.limit),
            'X-RateLimit-Remaining': String(rate.remaining),
          },
        });
      } catch (error) {
        lastError = error;
      }
    }

    return new NextResponse(
      `event: error\ndata: ${JSON.stringify({
        error:
          lastError instanceof Error
            ? lastError.message
            : 'Unable to reach Saby agent service',
      })}\n\n`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/event-stream' },
      }
    );
  } catch {
    return new NextResponse(
      'event: error\ndata: {"error":"Internal server error"}\n\n',
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }
}
