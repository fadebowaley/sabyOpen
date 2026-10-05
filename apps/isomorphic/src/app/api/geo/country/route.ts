import { NextRequest, NextResponse } from 'next/server';
import { buildInternalApiUrl } from '../../_lib/backend-url';

const normalizeCountry = (value: string | null | undefined) => {
  const country = String(value || '')
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : null;
};

const readCountryFromRequest = (request: NextRequest) =>
  normalizeCountry(
    request.headers.get('cf-ipcountry') ||
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('x-country') ||
      request.headers.get('cloudfront-viewer-country')
  );

export async function GET(request: NextRequest) {
  const edgeCountry = readCountryFromRequest(request);

  try {
    const upstream = await fetch(buildInternalApiUrl('/geo/country'), {
      headers: {
        'Content-Type': 'application/json',
        ...(edgeCountry ? { 'x-country': edgeCountry } : {}),
      },
      cache: 'no-store',
    });

    const data = (await upstream.json().catch(() => ({}))) as {
      country?: string | null;
    };
    const country = edgeCountry || normalizeCountry(data?.country);

    return NextResponse.json(
      { country },
      {
        status: upstream.ok ? 200 : upstream.status,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch {
    return NextResponse.json(
      { country: edgeCountry || null },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
