'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getPermReport,
  type PermReportFilters,
  type PermReportResponse,
} from '../api/permReport';

interface UsePermReportOptions {
  filters: PermReportFilters;
  pageIndex?: number;
  pageSize?: number;
}

interface UsePermReportReturn {
  report: (PermReportResponse & { projectName?: string }) | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const usePermReport = ({
  filters,
  pageIndex = 0,
  pageSize = 25,
}: UsePermReportOptions): UsePermReportReturn => {
  const { data: session } = useSession();
  const [state, setState] = useState<UsePermReportReturn>({
    report: null,
    loading: true,
    error: null,
    refresh: () => undefined,
  });

  const effectiveFilters = useMemo<PermReportFilters>(() => {
    const tenantId = filters.tenant_id || session?.user?.tenantId;
    return {
      ...filters,
      tenant_id: tenantId,
      limit: pageSize,
      offset: pageIndex * pageSize,
    };
  }, [filters, pageIndex, pageSize, session?.user?.tenantId]);

  const fetchData = useCallback(async () => {
    if (!effectiveFilters.tenant_id) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Tenant information missing',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await getPermReport(effectiveFilters);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
        report: {
          ...response,
        },
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || 'Failed to fetch PERM report',
      }));
    }
  }, [effectiveFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh,
  };
};


