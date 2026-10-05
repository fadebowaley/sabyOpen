'use client';

export type CurrentSubscriptionRuntime = {
  id?: string;
  planId?: string;
  planName?: string;
  status?: string;
  billingPeriod?: string;
  currency?: string;
  paymentProvider?: string;
  renewalAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  addOns?: Array<{ id?: string; name?: string } | string>;
  entitlements?: Record<string, any>;
  usage?: Record<string, any>;
  usageAssessment?: Record<string, any>;
} | null;

export type SubscriptionAccessState = {
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

export type SubscriptionCapabilityKey =
  | 'apiAccess'
  | 'advancedExports'
  | 'workflowsApprovals'
  | 'paymentsCollection'
  | 'settlement';

const SUBSCRIPTION_CAPABILITY_LABELS: Record<
  SubscriptionCapabilityKey,
  string
> = {
  apiAccess: 'API Access',
  advancedExports: 'Advanced Exports',
  workflowsApprovals: 'Workflows & Approvals',
  paymentsCollection: 'Payment Collection',
  settlement: 'Settlement',
};

export const canBypassSubscriptionGate = (user: any) =>
  Boolean(user?.isSaby);

export const canManageSubscription = (user: any) =>
  Boolean(user?.isOwner || user?.isSuper || user?.isSaby);

const getCapabilityMap = (subscription: CurrentSubscriptionRuntime) => {
  const entitlements =
    subscription && typeof subscription === 'object' ? subscription.entitlements : null;
  if (!entitlements || typeof entitlements !== 'object' || Array.isArray(entitlements)) {
    return {};
  }

  const capabilities = (entitlements as Record<string, any>).capabilities;
  if (!capabilities || typeof capabilities !== 'object' || Array.isArray(capabilities)) {
    return {};
  }

  return capabilities as Record<string, any>;
};

export const getSubscriptionCapabilityLabel = (
  capability: SubscriptionCapabilityKey
) => SUBSCRIPTION_CAPABILITY_LABELS[capability];

export const hasSubscriptionCapability = (
  subscription: CurrentSubscriptionRuntime,
  capability: SubscriptionCapabilityKey
) => Boolean(getCapabilityMap(subscription)[capability]);

export const resolveSubscriptionAccessState = (
  subscription: CurrentSubscriptionRuntime
): SubscriptionAccessState => {
  const rawStatus = String(subscription?.status || '').trim().toLowerCase();

  if (!rawStatus) {
    return {
      normalizedStatus: 'missing',
      isActive: false,
      requiresBillingAction: true,
    };
  }

  if (rawStatus === 'active' || rawStatus === 'trialing') {
    return {
      normalizedStatus: rawStatus,
      isActive: true,
      requiresBillingAction: false,
    };
  }

  if (rawStatus === 'pending' || rawStatus === 'paused') {
    return {
      normalizedStatus: rawStatus,
      isActive: false,
      requiresBillingAction: true,
    };
  }

  if (rawStatus === 'past_due') {
    return {
      normalizedStatus: 'past_due',
      isActive: false,
      requiresBillingAction: true,
    };
  }

  if (rawStatus === 'cancelled') {
    return {
      normalizedStatus: 'cancelled',
      isActive: false,
      requiresBillingAction: true,
    };
  }

  if (rawStatus === 'expired') {
    return {
      normalizedStatus: 'expired',
      isActive: false,
      requiresBillingAction: true,
    };
  }

  return {
    normalizedStatus: 'missing',
    isActive: false,
    requiresBillingAction: true,
  };
};

export const fetchCurrentSubscriptionRuntime =
  async (): Promise<CurrentSubscriptionRuntime> => {
    const response = await fetch('/api/subscriptions/current', {
      method: 'GET',
      cache: 'no-store',
    });

    const payload = (await response
      .json()
      .catch(() => ({ subscription: null }))) as {
      subscription?: CurrentSubscriptionRuntime;
      message?: string;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(
        payload?.message || payload?.error || 'Failed to load current subscription'
      );
    }

    return payload?.subscription || null;
  };
