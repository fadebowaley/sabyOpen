// lib/auth/tokenUtils.ts
import { api } from '../axios';

// Simple rate limiting for token refresh
const refreshAttempts = new Map<string, number>();
const ongoingRefresh = new Map<string, Promise<any>>();

/**
 * Checks if a JWT token is expired.
 * @param token - The JWT token string.
 * @returns {boolean} - Returns true if the token is expired or invalid, false otherwise.
 */
export function checkExpiration(token: string | undefined): boolean {
  try {
    if (!token || typeof token !== 'string') {
      return true;
    }

    const [, payload] = token.split('.');
    if (!payload) {
      return true;
    }

    const { exp } = JSON.parse(atob(payload));

    if (!exp || typeof exp !== 'number') {
      return true;
    }

    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Requests a new access token using a refresh token.
 * @param refreshToken - The refresh token string.
 * @returns {Promise<{ accessToken: string, refreshToken: string } | null>} - Returns the new tokens or null if failed.
 */
export const refreshAccessToken = async (refreshToken: string) => {
  const now = Date.now();
  const lastAttempt = refreshAttempts.get(refreshToken) || 0;
  const timeSinceLastAttempt = now - lastAttempt;

  if (timeSinceLastAttempt < 60000) {
    return null;
  }

  const existingRefresh = ongoingRefresh.get(refreshToken);
  if (existingRefresh) {
    return await existingRefresh;
  }

  refreshAttempts.set(refreshToken, now);

  const refreshPromise = (async () => {
    try {
      const { data } = await api.post('/auth/refresh-tokens', {
        refreshToken,
      });

      const { access, refresh } = data;

      if (!access?.token || !refresh?.token) {
        return null;
      }

      return {
        accessToken: access.token,
        refreshToken: refresh.token,
      };
    } catch {
      return null;
    } finally {
      ongoingRefresh.delete(refreshToken);
      for (const [token, timestamp] of refreshAttempts.entries()) {
        if (now - timestamp > 10 * 60 * 1000) {
          refreshAttempts.delete(token);
        }
      }
    }
  })();

  ongoingRefresh.set(refreshToken, refreshPromise);

  return await refreshPromise;
};
