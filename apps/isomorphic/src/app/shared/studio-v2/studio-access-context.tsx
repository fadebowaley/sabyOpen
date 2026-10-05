'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';

export type StudioAccessSubscription = {
  id?: string | null;
  planId?: string | null;
  planName?: string | null;
  status?: string | null;
  billingPeriod?: string | null;
  currency?: string | null;
  paymentProvider?: string | null;
  renewalAt?: string | Date | null;
  currentPeriodStart?: string | Date | null;
  currentPeriodEnd?: string | Date | null;
  addOns?: Array<{ id?: string | null; name?: string | null }>;
  entitlements?: Record<string, any> | null;
  usage?: Record<string, any> | null;
  usageAssessment?: Record<string, any> | null;
  accessState?: {
    normalizedStatus:
      | 'active'
      | 'trialing'
      | 'pending'
      | 'paused'
      | 'past_due'
      | 'cancelled'
      | 'expired'
      | 'missing';
    isActive: boolean;
    requiresBillingAction: boolean;
  };
} | null;

export type StudioAccessOnboarding = {
  required?: boolean;
  completed?: boolean;
  reason?: string | null;
  profile?: Record<string, any> | null;
  memberships?: Array<Record<string, any>>;
  primaryWorkspace?: Record<string, any> | null;
} | null;

export type StudioAccessState = {
  tenantId?: string | null;
  userId?: string | null;
  resolvedAt?: string | null;
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  onboarding: StudioAccessOnboarding;
  subscription: StudioAccessSubscription;
  permissions: string[];
  roles: string[];
  flags: {
    bypassSubscriptionGate: boolean;
    canManageBilling: boolean;
    isWorkspaceTeamManager: boolean;
  };
  canEnterStudio: boolean;
};

type StudioAccessContextValue = {
  loading: boolean;
  hasError: boolean;
  accessState: StudioAccessState | null;
  refresh: () => Promise<void>;
};

const StudioAccessContext = createContext<StudioAccessContextValue | null>(null);
const STUDIO_ACCESS_CACHE_PREFIX = 'studio:access:session-cache:v1';

const emptyAccessState = (
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated'
): StudioAccessState => ({
  sessionStatus,
  onboarding: null,
  subscription: null,
  permissions: [],
  roles: [],
  flags: {
    bypassSubscriptionGate: false,
    canManageBilling: false,
    isWorkspaceTeamManager: false,
  },
  canEnterStudio: false,
});

const isBrowser = () => typeof window !== 'undefined';

const buildStudioAccessCacheKey = ({
  tenantId,
  userId,
  roleKey,
  permissionKey,
  isOwner,
  isAdmin,
  isSuper,
  isSaby,
}: {
  tenantId: string | null;
  userId: string | null;
  roleKey: string;
  permissionKey: string;
  isOwner: boolean;
  isAdmin: boolean;
  isSuper: boolean;
  isSaby: boolean;
}) =>
  [
    STUDIO_ACCESS_CACHE_PREFIX,
    `tenant:${String(tenantId || '').trim() || 'none'}`,
    `user:${String(userId || '').trim() || 'none'}`,
    `roles:${roleKey || 'none'}`,
    `permissions:${permissionKey || 'none'}`,
    `owner:${isOwner ? '1' : '0'}`,
    `admin:${isAdmin ? '1' : '0'}`,
    `super:${isSuper ? '1' : '0'}`,
    `saby:${isSaby ? '1' : '0'}`,
  ].join(':');

const readCachedStudioAccessState = (cacheKey: string) => {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as StudioAccessState) : null;
  } catch {
    return null;
  }
};

const writeCachedStudioAccessState = (cacheKey: string, value: StudioAccessState) => {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(cacheKey, JSON.stringify(value));
  } catch {
    // Browser storage is a UX hint only. Cache failures must not block access.
  }
};

export function StudioAccessProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [hasError, setHasError] = useState(false);

  const user = session?.user as any;
  const userId = user?.id || user?._id || null;
  const tenantId = user?.tenantId || null;
  const isSaby = Boolean(user?.isSaby);
  const isOwner = Boolean(user?.isOwner);
  const isSuper = Boolean(user?.isSuper);
  const isAdmin = Boolean(user?.isAdmin);
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const roleKey = roles.join('|');
  const permissionKey = permissions.join('|');
  const accessCacheKey = useMemo(
    () =>
      buildStudioAccessCacheKey({
        tenantId,
        userId,
        roleKey,
        permissionKey,
        isOwner,
        isAdmin,
        isSuper,
        isSaby,
      }),
    [isAdmin, isOwner, isSaby, isSuper, permissionKey, roleKey, tenantId, userId]
  );
  const cachedAccessState = useMemo(
    () => (userId ? readCachedStudioAccessState(accessCacheKey) : null),
    [accessCacheKey, userId]
  );
  const [accessState, setAccessState] = useState<StudioAccessState | null>(
    cachedAccessState
  );
  const [loading, setLoading] = useState<boolean>(() => !cachedAccessState);

  const loadAccessState = useCallback(async () => {
    if (status === 'loading') {
      if (cachedAccessState) {
        setLoading(false);
        setHasError(false);
        setAccessState(cachedAccessState);
        return;
      }

      setLoading(true);
      setHasError(false);
      setAccessState(null);
      return;
    }

    if (status !== 'authenticated' || !userId) {
      setLoading(false);
      setHasError(false);
      setAccessState(null);
      return;
    }

    if (!cachedAccessState) {
      setLoading(true);
    }
    setHasError(false);

    if (cachedAccessState) {
      setAccessState(cachedAccessState);
      setLoading(false);
    }

    try {
      const response = await fetch('/api/studio/access-state', {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        data?: StudioAccessState;
        message?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.message || payload?.error || 'Failed to load studio access state');
      }

      const resolvedAccessState = payload.data as StudioAccessState;
      setAccessState(resolvedAccessState);
      writeCachedStudioAccessState(accessCacheKey, resolvedAccessState);
      setHasError(false);
    } catch {
      if (!cachedAccessState) {
        setHasError(true);
        setAccessState({
          ...emptyAccessState('authenticated'),
          tenantId,
          userId,
          roles,
          permissions,
          flags: {
            bypassSubscriptionGate: isSaby,
            canManageBilling: Boolean(isOwner || isSuper || isSaby),
            isWorkspaceTeamManager: Boolean(isOwner || isAdmin || isSuper || isSaby),
          },
          canEnterStudio: Boolean(isSaby),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [
    accessCacheKey,
    cachedAccessState,
    isAdmin,
    isOwner,
    isSaby,
    isSuper,
    permissionKey,
    roleKey,
    status,
    tenantId,
    userId,
  ]);

  useEffect(() => {
    void loadAccessState();
  }, [loadAccessState]);

  const value = useMemo(
    () => ({
      loading,
      hasError,
      accessState,
      refresh: loadAccessState,
    }),
    [accessState, hasError, loadAccessState, loading]
  );

  return (
    <StudioAccessContext.Provider value={value}>
      {children}
    </StudioAccessContext.Provider>
  );
}

export const useStudioAccessState = () => useContext(StudioAccessContext);
