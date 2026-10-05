import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

async function getAccessToken(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return (token as any)?.accessToken || (token as any)?.user?.accessToken || null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId } = await context.params;
  if (!threadId) {
    return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
  }

  // 1. Copilot
  for (const baseUrl of getCopilotAgentCandidates()) {
    try {
      const upstream = await fetch(`${baseUrl}/history/threads/${encodeURIComponent(threadId)}`, {
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

  // 2. Backend
  for (const baseUrl of getBackendCandidates()) {
    const backendPath = baseUrl.endsWith('/v1')
      ? `${baseUrl}/agent/history/threads/${encodeURIComponent(threadId)}`
      : `${baseUrl}/v1/agent/history/threads/${encodeURIComponent(threadId)}`;

    try {
      const upstream = await fetch(backendPath, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (upstream.ok) {
        const data: any = await upstream.json().catch(() => null);
        if (data?.status === 'success' && data.data) {
          const it = data.data;
          const rawMessages = it.messages || it.turns || [];
          const turns = rawMessages.map((m: any) => ({
            id: String(m.id || m.turnId || `turn-${Date.now()}`),
            role: m.role === 'assistant' ? 'assistant' : 'user',
            text: m.text || m.content || '',
            reasoning: m.reasoning || undefined,
            createdAt: m.createdAt || undefined,
          }));
          return NextResponse.json({
            ok: true,
            data: {
              id: it.threadId || it.id,
              title: it.title || 'Untitled chat',
              preview: it.preview || it.metadata?.preview || '',
              updatedAt: it.updatedAt || it.createdAt || new Date().toISOString(),
              turns,
            },
          });
        }
      }
    } catch {
      // next
    }
  }

  return NextResponse.json({ ok: true, data: null });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId } = await context.params;
  if (!threadId) {
    return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
  }

  // 1. Copilot
  for (const baseUrl of getCopilotAgentCandidates()) {
    try {
      const upstream = await fetch(`${baseUrl}/history/threads/${encodeURIComponent(threadId)}`, {
        method: 'DELETE',
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

  // 2. Backend
  for (const baseUrl of getBackendCandidates()) {
    const backendPath = baseUrl.endsWith('/v1')
      ? `${baseUrl}/agent/history/threads/${encodeURIComponent(threadId)}`
      : `${baseUrl}/v1/agent/history/threads/${encodeURIComponent(threadId)}`;

    try {
      const upstream = await fetch(backendPath, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (upstream.ok) {
        const data: any = await upstream.json().catch(() => null);
        return NextResponse.json({ ok: true, data });
      }
    } catch {
      // next
    }
  }

  return NextResponse.json({ ok: true, deleted: true });
}
