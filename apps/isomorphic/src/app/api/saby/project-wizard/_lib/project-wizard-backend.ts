import 'server-only';

import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { buildInternalApiUrl } from '@/app/api/_lib/backend-url';

export const getProjectWizardAccessToken = async (request: NextRequest) => {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const accessToken =
    (token as any)?.accessToken || (token as any)?.user?.accessToken;

  if (!token || !accessToken) {
    return null;
  }

  return String(accessToken);
};

export const callProjectWizardBackend = async (
  accessToken: string,
  path: string,
  init: RequestInit
) => {
  const response = await fetch(buildInternalApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  return { response, data };
};
