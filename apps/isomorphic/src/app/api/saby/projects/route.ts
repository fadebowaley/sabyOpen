import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { buildInternalApiUrl } from '../../_lib/backend-url';
import { checkRateLimit, getClientIp } from '../../_lib/rate-limit';

const PROJECT_LIST_LIMIT = 30;
const PROJECT_LIST_WINDOW_MS = 10 * 60 * 1000;

const pickArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data?.results)) return value.data.results;
  if (Array.isArray(value?.data?.docs)) return value.data.docs;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
};

export async function GET(request: NextRequest) {
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
      `saby-projects:${subject}`,
      PROJECT_LIST_LIMIT,
      PROJECT_LIST_WINDOW_MS
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

    const query = new URLSearchParams({
      limit: '100',
      sortBy: 'updatedAt:desc',
    });

    const upstream = await fetch(buildInternalApiUrl(`/project-forms?${query}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data: any = await upstream
      .json()
      .catch(() => ({ message: 'Invalid project list response' }));

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Failed to load projects' },
        { status: upstream.status }
      );
    }

    const rows = pickArray(data);
    const items = rows
      .map((row: any) => {
        const projectId = row?.projectId || row?.id || row?._id;
        const name =
          row?.configuration?.projectName || row?.name || row?.title || projectId;
        if (!projectId || !name) return null;
        return {
          projectId: String(projectId),
          name: String(name),
          status: String(
            row?.metadata?.deploymentStatus || row?.status || 'unknown'
          ),
          updatedAt: row?.updatedAt || row?.createdAt || null,
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      { items },
      {
        headers: {
          'X-RateLimit-Limit': String(rate.limit),
          'X-RateLimit-Remaining': String(rate.remaining),
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
