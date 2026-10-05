'use client';

import { useEffect, useState } from 'react';
import type { SabyBillingCurrency } from './saby-pricing-plans';

const STORAGE_KEY = 'saby:geo-country';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type GeoCache = {
  country: string | null;
  ts: number;
};

function readCache(): GeoCache | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeoCache;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(country: string | null) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ country, ts: Date.now() })
    );
  } catch {
    // ignore
  }
}

export function useGeoCountry(): {
  country: string | null;
  defaultCurrency: SabyBillingCurrency;
  loading: boolean;
} {
  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setCountry(cached.country);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetch('/api/geo/country', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const c =
          data && typeof data === 'object' && 'country' in data
            ? String((data as { country?: unknown }).country || '')
                .trim()
                .toUpperCase() || null
            : null;
        setCountry(c);
        writeCache(c);
      })
      .catch(() => {
        if (cancelled) return;
        setCountry(null);
        writeCache(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const defaultCurrency: SabyBillingCurrency =
    country === 'NG' ? 'NGN' : 'USD';

  return { country, defaultCurrency, loading };
}
