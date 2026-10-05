import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

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

const MIME_MAP: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ file: string[] }> }
) {
  const params = await context.params;
  const filename = (params.file || []).join('/');

  if (!filename || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // 1. Attempt to fetch from agent server candidates
  const candidates = getCopilotAgentCandidates();
  for (const baseUrl of candidates) {
    try {
      const upstream = await fetch(`${baseUrl}/island/${filename}`, {
        cache: 'no-store',
      });
      if (upstream.ok && upstream.body) {
        const contentType =
          upstream.headers.get('content-type') ||
          (filename.endsWith('.js')
            ? 'application/javascript; charset=utf-8'
            : 'text/plain');
        return new NextResponse(upstream.body, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }
    } catch {
      // Upstream failed, try next candidate
    }
  }

  // 2. Fallback: local static file in public/islands/ or build output
  const candidateLocalPaths = [
    join(process.cwd(), 'public', 'islands', filename),
    join(process.cwd(), 'apps', 'isomorphic', 'public', 'islands', filename),
    join(process.cwd(), '..', '..', 'packages', 'ui', 'dist', 'island', filename),
    join('/app', 'public', 'islands', filename),
    join('/app', 'apps', 'isomorphic', 'public', 'islands', filename),
  ];

  for (const localPath of candidateLocalPaths) {
    try {
      const content = await readFile(localPath);
      const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
      const contentType =
        MIME_MAP[ext] || 'application/javascript; charset=utf-8';
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch {
      // try next candidate
    }
  }

  return NextResponse.json(
    { error: 'Island asset not found' },
    { status: 404 }
  );
}
