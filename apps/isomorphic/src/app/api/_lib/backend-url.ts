const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const resolveInternalApiBaseUrl = () => {
  const configured =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_SERVER_URL_BASE ||
    'http://backend:4000/v1';

  const sanitized = trimTrailingSlash(configured);
  return sanitized.endsWith('/v1') ? sanitized : `${sanitized}/v1`;
};

export const buildInternalApiUrl = (path: string) => {
  const base = resolveInternalApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

