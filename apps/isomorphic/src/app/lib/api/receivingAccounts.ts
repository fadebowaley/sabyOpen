import {
  normalizeReceivingAccounts,
  type ReceivingAccount,
} from '@/app/lib/utils/receiving-accounts';

type TenantReceivingAccountsResponse = {
  ok: boolean;
  receivingAccounts?: ReceivingAccount[];
  error?: string;
};

export const getTenantReceivingAccounts = async (): Promise<ReceivingAccount[]> => {
  const response = await fetch('/api/saby/onboarding/profile', { cache: 'no-store' });
  const payload = await response.json();

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to load receiving accounts');
  }

  return normalizeReceivingAccounts(payload?.data?.profile?.company?.receivingAccounts);
};

export const updateTenantReceivingAccounts = async (
  receivingAccounts: ReceivingAccount[]
): Promise<ReceivingAccount[]> => {
  const response = await fetch('/api/saby/onboarding/profile/receiving-accounts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receivingAccounts: normalizeReceivingAccounts(receivingAccounts),
    }),
  });

  const payload = (await response.json()) as TenantReceivingAccountsResponse;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Failed to save receiving accounts');
  }

  return normalizeReceivingAccounts(payload.receivingAccounts);
};

