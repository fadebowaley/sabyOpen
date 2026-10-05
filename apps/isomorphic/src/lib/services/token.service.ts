import sessionConfig from "@/config/session.config.json";

export class TokenService {
  private static instance: TokenService;

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Check if token should be refreshed
   */
  shouldRefreshToken(token: string | undefined): boolean {
    if (!token || !sessionConfig.tokenRefresh.enabled) return false;

    try {
      const [, payload] = token.split(".");
      if (!payload) return true;

      const { exp } = JSON.parse(atob(payload));
      if (!exp) return true;

      const expiresIn = exp * 1000 - Date.now();
      const refreshThreshold =
        sessionConfig.tokenRefresh.refreshBeforeExpiry * 1000;

      return expiresIn < refreshThreshold && expiresIn > 0;
    } catch {
      return true;
    }
  }

  /**
   * Check if token is expired (Edge Runtime compatible)
   */
  isTokenExpired(token: string | undefined): boolean {
    try {
      // If token is null, undefined, or empty, treat as expired
      if (!token || typeof token !== 'string') {
        return true;
      }

      const [, payload] = token.split('.');
      if (!payload) {
        return true;
      }

      // Parse the payload and extract the 'exp' property (expiration time)
      const { exp } = JSON.parse(atob(payload));

      // If no expiration time, treat as expired
      if (!exp || typeof exp !== 'number') {
        return true;
      }

      return Date.now() >= exp * 1000;
    } catch {
      // If parsing fails, treat the token as expired
      return true;
    }
  }

  /**
   * Get token expiry time in seconds
   */
  getTokenExpiryTime(token: string | undefined): number | null {
    if (!token) return null;

    try {
      const [, payload] = token.split(".");
      if (!payload) return null;

      const { exp } = JSON.parse(atob(payload));
      return exp;
    } catch {
      return null;
    }
  }

  /**
   * Decode token payload
   */
  decodeToken(token: string): any | null {
    try {
      const [, payload] = token.split(".");
      if (!payload) return null;
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}

export const tokenService = TokenService.getInstance();

