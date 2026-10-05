import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';
import { buildInternalApiUrl } from '../../../_lib/backend-url';

/**
 * POST /api/saby/agent/feedback
 *
 * Accepts a thumbs-up / thumbs-down (or richer) rating from the chat UI and
 * proxies it to the backend POST /v1/copilot/feedback endpoint.
 *
 * The backend stores every vote in copilot.feedback_events and uses them for
 * nightly eval runs that continuously improve the model selection policy.
 */

const bodySchema = z.object({
  /** Required: 'helpful' | 'not_helpful' | 'correct' | 'incorrect' */
  feedbackType: z.enum(['helpful', 'not_helpful', 'correct', 'incorrect', 'partial', 'unsafe']),

  /** Optional: the UUID turn-log ID returned by the agent (when available) */
  taskId: z.string().uuid().nullable().optional(),

  /** Optional: 1–5 star rating */
  rating: z.number().int().min(1).max(5).nullable().optional(),

  /** Optional: free-text comment / correction */
  comment: z.string().max(2000).nullable().optional(),

  /** Optional: the intent/route of the turn, e.g. "INCIDENT" */
  workflowName: z.string().max(120).nullable().optional(),
});

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

    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'feedbackType is required (helpful | not_helpful | correct | incorrect).' },
        { status: 400 }
      );
    }

    const backendUrl = buildInternalApiUrl('/copilot/feedback');

    const upstream = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        feedbackType: parsed.data.feedbackType,
        taskId:       parsed.data.taskId       ?? null,
        rating:       parsed.data.rating       ?? null,
        comment:      parsed.data.comment      ?? null,
        workflowName: parsed.data.workflowName ?? null,
      }),
    });

    const data: any = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Feedback submission failed' },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/saby/agent/feedback
 *
 * Proxies to GET /v1/copilot/feedback.
 * Supports optional query params: taskId, workflowName, limit.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken || (token as any)?.user?.accessToken;
    if (!token || !accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    if (searchParams.get('taskId')) params.set('taskId', searchParams.get('taskId')!);
    if (searchParams.get('workflowName')) params.set('workflowName', searchParams.get('workflowName')!);
    if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);

    const qs = params.toString();
    const upstream = await fetch(
      buildInternalApiUrl(`/copilot/feedback${qs ? `?${qs}` : ''}`),
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
