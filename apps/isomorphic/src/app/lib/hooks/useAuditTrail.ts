'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  getAuditTrail,
  type AuditTrailFilters,
  type AuditTrailEntry,
  type AuditTrailResponse,
} from '@/app/lib/api/auditTrail';

interface UseAuditTrailOptions {
  pageIndex: number;
  pageSize: number;
  filters: AuditTrailFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAuditTrailResult {
  entries: AuditTrailEntry[];
  loading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  refresh: () => void;
  pageIndex: number;
  pageSize: number;
}

export function useAuditTrail({
  pageIndex,
  pageSize,
  filters,
  autoRefresh = true,
  refreshInterval = 30000,
}: UseAuditTrailOptions): UseAuditTrailResult {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken as string | undefined;

  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response: AuditTrailResponse = await getAuditTrail(
        {
          ...filters,
          page: pageIndex + 1,
          limit: pageSize,
        },
        accessToken
      );

      if (mountedRef.current) {
        setEntries(response.results || []);
        setTotal(response.total || 0);
        setTotalPages(response.totalPages || 0);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return;
      if (mountedRef.current) {
        setError(err?.message || 'Failed to fetch audit trail');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [pageIndex, pageSize, JSON.stringify(filters), accessToken]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    entries,
    loading,
    error,
    total,
    totalPages,
    refresh: fetchData,
    pageIndex,
    pageSize,
  };
}
