'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef } from 'react';

interface ActivityTrackerConfig {
  // How long to wait before considering user inactive (in milliseconds)
  inactiveThreshold?: number;
  // How often to check activity (in milliseconds)
  checkInterval?: number;
  // Events to track as user activity
  trackEvents?: string[];
}

const DEFAULT_CONFIG: Required<ActivityTrackerConfig> = {
  inactiveThreshold: 5 * 60 * 1000, // 5 minutes
  checkInterval: 60 * 1000, // 60 seconds (increased from 30 to reduce frequency)
  trackEvents: [
    // Removed click and mousemove to prevent navigation blocking
    'keypress',
    'scroll',
    'touchstart',
    'focus',
  ],
};

export const useActivityTracker = (config: ActivityTrackerConfig = {}) => {
  const { data: session, update } = useSession();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const isUpdatingRef = useRef<boolean>(false); // Prevent overlapping session updates

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check if we need to extend the session
  const checkAndExtendSession = useCallback(async () => {
    if (!session?.user) return;
    if (isUpdatingRef.current) return; // Skip if already updating

    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;

    // If user has been active recently, extend the session
    if (timeSinceActivity < finalConfig.inactiveThreshold) {
      try {
        // Check if NextAuth is in the middle of a token refresh
        const sessionData = session as any;
        const isStale = sessionData.isStale === true;

        if (isStale) {
          return; // Silently skip
        }

        // Only update if we have a valid session and access token
        if (!session?.user?.accessToken) {
          return; // Silently skip
        }

        // Set flag to prevent overlapping updates
        isUpdatingRef.current = true;
        
        // Fire and forget - no await, no blocking
        update({
          lastActivity: now,
          extendedAt: now,
        }).finally(() => {
          isUpdatingRef.current = false;
        });
        
        // Return immediately - don't block!
      } catch (error: any) {
        isUpdatingRef.current = false;
        // Silently handle errors
      }
    }
  }, [session, update, finalConfig.inactiveThreshold]);

  // Set up activity listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add event listeners for user activity
    finalConfig.trackEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up interval to check and extend session
    checkIntervalRef.current = setInterval(
      checkAndExtendSession,
      finalConfig.checkInterval
    );

    return () => {
      // Cleanup event listeners
      finalConfig.trackEvents.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });

      // Clear interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [updateActivity, checkAndExtendSession, finalConfig]);

  return {
    lastActivity: lastActivityRef.current,
    isActive:
      Date.now() - lastActivityRef.current < finalConfig.inactiveThreshold,
    extendSession: checkAndExtendSession,
  };
};
