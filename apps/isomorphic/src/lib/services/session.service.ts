import { signOut } from "next-auth/react";
import sessionConfig from "@/config/session.config.json";
import redirectConfig from "@/config/redirect.config.json";
import { tokenService } from "./token.service";

export class SessionManager {
  private static instance: SessionManager;
  private activityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private sessionWarningCallback?: () => void;

  private constructor() {
    if (
      typeof window !== "undefined" &&
      sessionConfig.activityTracking.enabled
    ) {
      this.initActivityTracking();
    }
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize activity tracking
   */
  private initActivityTracking() {
    const events = sessionConfig.activityTracking.trackEvents;
    const debounce = sessionConfig.activityTracking.debounceDelay;

    let debounceTimer: NodeJS.Timeout;

    const handleActivity = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.updateActivity();
      }, debounce);
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    this.lastActivity = Date.now();
    this.resetTimers();
  }

  /**
   * Start session timeout monitoring
   */
  startSessionMonitoring(warningCallback?: () => void) {
    if (!sessionConfig.sessionTimeout.enabled) return;

    this.sessionWarningCallback = warningCallback;
    this.resetTimers();
  }

  /**
   * Reset session timers
   */
  private resetTimers() {
    if (this.activityTimer) clearTimeout(this.activityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);

    const { idleTimeout, warningTime } = sessionConfig.sessionTimeout;

    // Set warning timer
    this.warningTimer = setTimeout(() => {
      if (this.sessionWarningCallback) {
        this.sessionWarningCallback();
      }
    }, (idleTimeout - warningTime) * 1000);

    // Set logout timer
    this.activityTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, idleTimeout * 1000);
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout() {
    console.warn("⏰ Session timeout - logging out user");
    await this.forceLogout("Session expired due to inactivity");
  }

  /**
   * Force logout
   */
  async forceLogout(reason?: string) {
    if (sessionConfig.security.clearSessionOnLogout) {
      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
    }

    console.log("🚪 Force logout:", reason);

    await signOut({
      redirect: true,
      callbackUrl: redirectConfig.sessionExpiredRedirect,
    });
  }

  /**
   * Check if session is valid
   */
  isSessionValid(session: any): boolean {
    if (!session?.user) return false;

    const { accessToken } = session.user;

    if (sessionConfig.security.enforceTokenExpiry) {
      if (tokenService.isTokenExpired(accessToken)) {
        return false;
      }
    }

    // Check absolute timeout
    if (sessionConfig.sessionTimeout.enabled) {
      const sessionAge = Date.now() - this.lastActivity;
      if (sessionAge > sessionConfig.sessionTimeout.absoluteTimeout * 1000) {
        return false;
      }
    }

    return true;
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring() {
    if (this.activityTimer) clearTimeout(this.activityTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
  }
}

export const sessionManager = SessionManager.getInstance();


