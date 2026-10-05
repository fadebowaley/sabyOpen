import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { z } from 'zod';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getCopilotAgentCandidates = () => {
  const configured = [
    process.env.INTERNAL_COPILOT_URL,
    process.env.COPILOT_AGENT_URL,
    process.env.NEXT_PUBLIC_COPILOT_AGENT_URL,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .filter((value) => !value.includes(':4000'));

  const defaults = [
    'http://saby-pr-copilot:3334',
    'http://localhost:3334',
    'http://copilot:3333',
    'http://localhost:3333',
  ];
  return [...configured, ...defaults].map((value) => trimTrailingSlash(value));
};

const getBackendCandidates = () => {
  const configured = [
    process.env.NEXT_SERVER_URL_BASE,
    process.env.INTERNAL_API_URL,
    process.env.NEXT_PUBLIC_SERVER_URL_BASE,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter((value): value is string => Boolean(value && value.trim()));

  const defaults = [
    'http://backend:4000/v1',
    'http://localhost:4000/v1',
    'http://backend:4000',
    'http://localhost:4000',
  ];
  return [...configured, ...defaults].map((value) => trimTrailingSlash(value));
};

const saveSchema = z.object({
  threadId: z.string().trim().min(1).max(128).optional(),
  title: z.string().trim().min(1).max(200),
  preview: z.string().max(500).optional().default(''),
  turns: z
    .array(
      z.object({
        id: z.string().min(1).max(128),
        role: z.enum(['user', 'assistant']),
        text: z.string().max(10000),
      })
    )
    .max(500),
});

async function getAccessToken(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
}

export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') || '50';

  // 1. Try Copilot Candidates
  for (const baseUrl of getCopilotAgentCandidates()) {
    try {
      const upstream = await fetch(`${baseUrl}/history/threads?limit=${encodeURIComponent(limit)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (upstream.ok) {
        const data: any = await upstream.json().catch(() => null);
        if (data?.ok) return NextResponse.json(data);
      }
    } catch {
      // next
    }
  }

  // 2. Try Backend Gateway Candidates
  for (const baseUrl of getBackendCandidates()) {
    const backendPath = baseUrl.endsWith('/v1')
      ? `${baseUrl}/agent/history/threads?limit=${encodeURIComponent(limit)}`
      : `${baseUrl}/v1/agent/history/threads?limit=${encodeURIComponent(limit)}`;

    try {
      const upstream = await fetch(backendPath, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (upstream.ok) {
        const data: any = await upstream.json().catch(() => null);
        if (data?.status === 'success' && data.data?.items) {
          const items = data.data.items.map((it: any) => ({
            id: it.threadId || it.id,
            title: it.title || 'Untitled chat',
            preview: it.preview || it.metadata?.preview || '',
            updatedAt: it.updatedAt || it.createdAt || new Date().toISOString(),
            turns: (Array.isArray(it.turns) ? it.turns : (it.messages || [])).map((m: any) => ({
              id: String(m.id || m.turnId || `turn-${Date.now()}`),
              role: m.role === 'assistant' ? 'assistant' : 'user',
              text: m.text || m.content || '',
              reasoning: m.reasoning || undefined,
              createdAt: m.createdAt || undefined,
            })),
          }));
          return NextResponse.json({ ok: true, data: { items } });
        }
      }
    } catch {
      // next
    }
  }

  // 3. Fallback: return empty list cleanly without 404/503 so client localStorage is used
  return NextResponse.json({ ok: true, data: { items: [] } });
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid thread payload' }, { status: 400 });
  }

  // 1. Try Copilot
  for (const baseUrl of getCopilotAgentCandidates()) {
    try {
      const upstream = await fetch(`${baseUrl}/history/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(parsed.data),
      });
      if (upstream.ok) {
        const data: any = await upstream.json().catch(() => null);
        if (data?.ok) return NextResponse.json(data);
      }
    } catch {
      // next
    }
  }

  // 2. Try Backend
  for (const baseUrl of getBackendCandidates()) {
    const backendPath = baseUrl.endsWith('/v1')
      ? `${baseUrl}/agent/history/threads`
      : `${baseUrl}/v1/agent/history/threads`;

    try {
      const upstream = await fetch(backendPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: parsed.data.title,
          threadId: parsed.data.threadId,
          preview: parsed.data.preview,
          turns: parsed.data.turns,
        }),
      });
      if (upstream.ok) {
        const data: any = await upstream.json().catch(() => null);
        return NextResponse.json({ ok: true, data });
      }
    } catch {
      // next
    }
  }

  // Fallback success for local store
  return NextResponse.json({ ok: true, data: { threadId: parsed.data.threadId, storedLocally: true } });
}
