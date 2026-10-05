import axios from 'axios';
import { getSession } from 'next-auth/react';
import { routes } from '@/config/routes';
import { refreshAccessToken } from '@/app/lib/api/token';
import { toast } from 'sonner';

// Use NEXT_SERVER_URL_BASE for server-side requests (SSR, API routes)
// Use NEXT_PUBLIC_SERVER_URL_BASE for client-side requests (browser)
const isServer = typeof window === 'undefined';

const normalizeServerApiUrl = (configuredUrl?: string) => {
  if (!configuredUrl) return configuredUrl;

  try {
    const parsed = new URL(configuredUrl);

    // Local Node.js sometimes resolves localhost to ::1 first.
    // Force IPv4 loopback to avoid ECONNREFUSED when backend listens on 127.0.0.1.
    if (parsed.hostname === 'localhost') {
      parsed.hostname = '127.0.0.1';
      return parsed.toString();
    }

    return configuredUrl;
  } catch {
    return configuredUrl;
  }
};

const resolveClientApiUrl = () => {
  const configured =
    process.env.NEXT_PUBLIC_SERVER_URL_BASE || process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured;

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

const apiUrl = isServer
  ? normalizeServerApiUrl(
      process.env.NEXT_SERVER_URL_BASE ||
        process.env.NEXT_PUBLIC_SERVER_URL_BASE ||
        process.env.NEXT_PUBLIC_API_URL
    )
  : resolveClientApiUrl();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveSessionWithRetry = async () => {
  const attempts = typeof window === 'undefined' ? 1 : 4;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const session = await getSession();
    if (session?.user?.accessToken) {
      return session;
    }

    if (attempt < attempts - 1) {
      await sleep(150 * (attempt + 1));
    }
  }

  return null;
};

// Production: Debug logging removed for performance and security

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT Request Interceptor - This application uses ONLY JWT authentication
// This app is for managing API keys for OTHER applications, not for using API keys itself
api.interceptors.request.use(
  async (config) => {
    // Production: Debug logging removed
    
    // Add JWT token from session - This app uses JWT only, no API keys
    const session = await resolveSessionWithRetry();
    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }
    
    // Ensure data is serializable
    if (config.data && typeof config.data === 'object') {
      try {
        JSON.stringify(config.data);
      } catch (error) {
        console.error('❌ API Request: Data contains circular references:', error);
        // Clean the data to remove circular references
        config.data = JSON.parse(JSON.stringify(config.data, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (value.constructor === Object || value.constructor === Array) {
              return value;
            }
            return '[Circular Reference]';
          }
          return value;
        }));
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// JWT Response Interceptor - Handles JWT token errors (401/403)
// This application uses JWT authentication only
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { response, config: originalRequest } = error;

    // Handle 401 Unauthorized
    if (response?.status === 401) {
      // Production: Debug logging removed

      // Try to refresh token
      const session = await resolveSessionWithRetry();
      if (session?.user?.refreshToken && !originalRequest._retry) {
        try {
          originalRequest._retry = true;
          const refreshed = await refreshAccessToken(session.user.refreshToken);
          if (refreshed?.accessToken) {
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Production: Error logging handled by error tracking service
          // Redirect to login (client-side only)
          if (typeof window !== "undefined") {
            window.location.href = routes.signIn + "?session=expired";
          }
        }
      } else {
        // No refresh token or retry already attempted
        if (typeof window !== "undefined") {
          window.location.href = routes.signIn + "?session=expired";
        }
      }
    }

    // Handle 403 Forbidden
    if (response?.status === 403) {
      const handleForbiddenLocally =
        (originalRequest as any)?.sabyHandleForbiddenLocally === true ||
        (originalRequest as any)?.skipAccessDeniedRedirect === true;

      if (handleForbiddenLocally) {
        return Promise.reject(error);
      }

      // Production: Debug logging removed

      const errorMessage =
        response.data?.message ||
        "You do not have permission to access this resource";

      toast.error(errorMessage, {
        duration: 5000,
      });

      // Optional: Redirect to access denied page
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/access-denied")) {
          setTimeout(() => {
            window.location.href = `/access-denied?reason=${encodeURIComponent(
              errorMessage
            )}`;
          }, 2000);
        }
      }
    }

    return Promise.reject(error);
  }
);
