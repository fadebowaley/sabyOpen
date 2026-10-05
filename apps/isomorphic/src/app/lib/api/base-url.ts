const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const deriveBrowserApiUrl = (): string | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000/v1';
  }

  if (hostname.startsWith('api.')) {
    return `${protocol}//${hostname}/v1`;
  }

  if (hostname.startsWith('app.') || hostname.startsWith('web.')) {
    return `${protocol}//api.${hostname.replace(/^(app|web)\./, '')}/v1`;
  }

  if (hostname.includes('.')) {
    return `${protocol}//api.${hostname}/v1`;
  }

  return undefined;
};

export const resolveClientApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return trimTrailingSlash(
      process.env.NEXT_SERVER_URL_BASE ||
        process.env.NEXT_PUBLIC_SERVER_URL_BASE ||
        process.env.NEXT_PUBLIC_API_URL ||
        ''
    );
  }

  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_SERVER_URL_BASE ||
      process.env.NEXT_PUBLIC_API_URL ||
      deriveBrowserApiUrl() ||
      ''
  );
};

export const resolveSocketBaseUrl = (): string => {
  const apiBase = resolveClientApiBaseUrl();
  return apiBase.replace(/\/v1$/, '');
};
