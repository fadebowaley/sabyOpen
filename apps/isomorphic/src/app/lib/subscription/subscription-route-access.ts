'use client';

import { routes } from '@/config/routes';
import {
  hasSubscriptionCapability,
  type CurrentSubscriptionRuntime,
  type SubscriptionCapabilityKey,
} from './subscription-runtime';

const ROUTE_CAPABILITY_RULES: Array<{
  route: string;
  capability: SubscriptionCapabilityKey;
}> = [
  { route: routes.apis, capability: 'apiAccess' },
  { route: routes.apiCenter, capability: 'apiAccess' },
  { route: routes.apiGoLive, capability: 'apiAccess' },
  { route: routes.apiApprovals, capability: 'apiAccess' },
  { route: routes.apiUserSettings, capability: 'apiAccess' },
];

const normalizePathname = (pathname?: string | null) => {
  const value = String(pathname || '').trim();
  if (!value) return '';
  return value.split('?')[0].split('#')[0];
};

export const getRouteRequiredSubscriptionCapability = (
  pathname?: string | null
): SubscriptionCapabilityKey | null => {
  const normalizedPath = normalizePathname(pathname);
  if (!normalizedPath) return null;

  const matchedRule = ROUTE_CAPABILITY_RULES.find(
    ({ route }) =>
      normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  );

  return matchedRule?.capability || null;
};

export const canAccessSubscriptionRoute = ({
  pathname,
  subscription,
  bypassGate = false,
  loading = false,
  hasError = false,
}: {
  pathname?: string | null;
  subscription: CurrentSubscriptionRuntime;
  bypassGate?: boolean;
  loading?: boolean;
  hasError?: boolean;
}) => {
  if (bypassGate || loading || hasError) {
    return true;
  }

  const requiredCapability = getRouteRequiredSubscriptionCapability(pathname);
  if (!requiredCapability) {
    return true;
  }

  return hasSubscriptionCapability(subscription, requiredCapability);
};
