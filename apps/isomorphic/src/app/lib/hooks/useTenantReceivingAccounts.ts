'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getTenantReceivingAccounts,
  updateTenantReceivingAccounts,
} from '@/app/lib/api/receivingAccounts';
import {
  normalizeReceivingAccounts,
  type ReceivingAccount,
} from '@/app/lib/utils/receiving-accounts';

export const useTenantReceivingAccounts = (enabled: boolean) => {
  const [accounts, setAccounts] = useState<ReceivingAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const nextAccounts = await getTenantReceivingAccounts();
      setAccounts(normalizeReceivingAccounts(nextAccounts));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (nextValue: ReceivingAccount[] = accounts) => {
    setSaving(true);
    try {
      const nextAccounts = await updateTenantReceivingAccounts(nextValue);
      setAccounts(normalizeReceivingAccounts(nextAccounts));
      return nextAccounts;
    } finally {
      setSaving(false);
    }
  }, [accounts]);

  return {
    accounts,
    setAccounts,
    loading,
    saving,
    save,
    reload: load,
  };
};
