'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  useStudioAccessState,
  type StudioAccessSubscription,
} from '@/app/shared/studio-v2/studio-access-context';
import {
  canBypassSubscriptionGate,
  canManageSubscription,
  fetchCurrentSubscriptionRuntime,
  hasSubscriptionCapability,
  resolveSubscriptionAccessState,
  type CurrentSubscriptionRuntime,
  type SubscriptionCapabilityKey,
} from './subscription-runtime';

type CurrentSubscriptionState = {
  loading: boolean;
  subscription: CurrentSubscriptionRuntime;
  hasError: boolean;
};

const optionalString = (value?: string | Date | null) => {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString();
  const normalized = String(value).trim();
  return normalized || undefined;
};

const normalizeStudioAccessSubscription = (
  subscription: StudioAccessSubscription
): CurrentSubscriptionRuntime => {
  if (!subscription) return null;

  return {
    id: optionalString(subscription.id),
    planId: optionalString(subscription.planId),
    planName: optionalString(subscription.planName),
    status: optionalString(subscription.status),
    billingPeriod: optionalString(subscription.billingPeriod),
    currency: optionalString(subscription.currency),
    paymentProvider: optionalString(subscription.paymentProvider),
    renewalAt: optionalString(subscription.renewalAt),
    currentPeriodStart: optionalString(subscription.currentPeriodStart),
    currentPeriodEnd: optionalString(subscription.currentPeriodEnd),
    addOns: Array.isArray(subscription.addOns)
      ? subscription.addOns.map((addOn) => ({
          id: optionalString(addOn?.id),
          name: optionalString(addOn?.name),
        }))
      : undefined,
    entitlements: subscription.entitlements || undefined,
    usage: subscription.usage || undefined,
    usageAssessment: subscription.usageAssessment || undefined,
  };
};

export function useCurrentSubscriptionRuntime({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) {
  const studioAccessContext = useStudioAccessState();
  const { data: session, status } = useSession();
  const [state, setState] = useState<CurrentSubscriptionState>({
    loading: enabled,
    subscription: null,
    hasError: false,
  });

  const user = session?.user;
  const bypassGate = useMemo(() => canBypassSubscriptionGate(user), [user]);
  const canManageBilling = useMemo(() => canManageSubscription(user), [user]);
  const rawStudioAccessSubscription =
    studioAccessContext?.accessState?.subscription || null;
  const studioAccessSubscription = useMemo(
    () => normalizeStudioAccessSubscription(rawStudioAccessSubscription),
    [rawStudioAccessSubscription]
  );
  const studioAccessSubscriptionAccessState =
    rawStudioAccessSubscription?.accessState || null;
  const studioAccessLoading = Boolean(studioAccessContext?.loading);
  const studioAccessHasError = Boolean(studioAccessContext?.hasError);
  const studioAccessBypassGate = Boolean(
    studioAccessContext?.accessState?.flags?.bypassSubscriptionGate || bypassGate
  );
  const useStudioAccessSnapshot = Boolean(
    studioAccessContext && !studioAccessContext.hasError
  );

  useEffect(() => {
    if (useStudioAccessSnapshot) {
      return;
    }

    if (!enabled) {
      setState({ loading: false, subscription: null, hasError: false });
      return;
    }

    if (status === 'loading') {
      setState({ loading: true, subscription: null, hasError: false });
      return;
    }

    if (status !== 'authenticated' || !user || bypassGate) {
      setState({ loading: false, subscription: null, hasError: false });
      return;
    }

    let cancelled = false;

    const loadSubscription = async () => {
      setState((current) => ({ ...current, loading: true }));

      try {
        const subscription = await fetchCurrentSubscriptionRuntime();
        if (!cancelled) {
          setState({
            loading: false,
            subscription,
            hasError: false,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            subscription: null,
            hasError: true,
          });
        }
      }
    };

    void loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [bypassGate, enabled, status, user, useStudioAccessSnapshot]);

  const accessState = useMemo(
    () =>
      (useStudioAccessSnapshot ? studioAccessSubscriptionAccessState : null) ||
      resolveSubscriptionAccessState(
        useStudioAccessSnapshot ? studioAccessSubscription : state.subscription
      ),
    [
      state.subscription,
      studioAccessSubscription,
      studioAccessSubscriptionAccessState,
      useStudioAccessSnapshot,
    ]
  );

  const canUseCapability = useMemo(
    () => (capability: SubscriptionCapabilityKey) =>
      studioAccessBypassGate ||
      hasSubscriptionCapability(
        useStudioAccessSnapshot ? studioAccessSubscription : state.subscription,
        capability
      ),
    [
      bypassGate,
      state.subscription,
      studioAccessBypassGate,
      studioAccessSubscription,
      useStudioAccessSnapshot,
    ]
  );

  if (useStudioAccessSnapshot) {
    return {
      user,
      sessionStatus: studioAccessContext?.accessState?.sessionStatus || status,
      loading: studioAccessLoading,
      hasError: studioAccessHasError,
      subscription: studioAccessSubscription,
      accessState,
      bypassGate: studioAccessBypassGate,
      canManageBilling,
      hasCapability: canUseCapability,
    };
  }

  return {
    user,
    sessionStatus: status,
    loading: state.loading,
    hasError: state.hasError,
    subscription: state.subscription,
    accessState,
    bypassGate,
    canManageBilling,
    hasCapability: canUseCapability,
  };
}
