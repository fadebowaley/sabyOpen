'use client';

import { useEffect, useState } from 'react';
import type { NigeriaBankRegistryEntry } from '@/app/lib/constants/nigeria-bank-registry';

export const useNigeriaBanks = () => {
  const [banks, setBanks] = useState<NigeriaBankRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadBanks = async () => {
      try {
        const response = await fetch('/api/nigeria-banks', { cache: 'no-store' });
        const payload = await response.json();
        if (!mounted) return;
        setBanks(Array.isArray(payload?.banks) ? payload.banks : []);
      } catch {
        if (!mounted) return;
        setBanks([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadBanks();
    return () => {
      mounted = false;
    };
  }, []);

  const findBankByName = (name: string) =>
    banks.find((entry) => entry.name === name) || null;

  return {
    banks,
    loading,
    findBankByName,
  };
};

