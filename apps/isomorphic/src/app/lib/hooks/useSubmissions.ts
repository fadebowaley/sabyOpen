/**
 * useSubmissions Hook
 * 
 * Custom hook for managing submission data
 * Pattern: Copy from useActivityLogs.ts
 */

'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  getSubmissions,
  getSubmissionById,
  submitData,
  retrySubmission,
  getSubmissionStats,
  type Submission,
  type SubmissionFilters,
  type SubmitDataPayload,
} from '../api/submissions';

interface UseSubmissionsOptions {
  filters?: SubmissionFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageIndex?: number;
  pageSize?: number;
}

interface SubmissionsState {
  submissions: Submission[];
  total: number;
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    perm: number;
    regular: number;
    complete: number;
    partial: number;
    incomplete: number;
  };
}

const DEFAULT_OPTIONS: Required<UseSubmissionsOptions> = {
  filters: {},
  autoRefresh: false,
  refreshInterval: 60000, // 60 seconds
  pageIndex: 0,
  pageSize: 25,
};

export const useSubmissions = (options: UseSubmissionsOptions = {}) => {
  const { data: session } = useSession();

  // Memoize final options to prevent infinite re-renders
  const finalOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [
      options.filters,
      options.autoRefresh,
      options.refreshInterval,
      options.pageIndex,
      options.pageSize,
    ]
  );

  const [state, setState] = useState<SubmissionsState>({
    submissions: [],
    total: 0,
    loading: true,
    error: null,
    stats: {
      total: 0,
      perm: 0,
      regular: 0,
      complete: 0,
      partial: 0,
      incomplete: 0,
    },
  });

  // Fetch submissions from API
  const fetchSubmissions = useCallback(async () => {
    if (!session?.user?.accessToken) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'No access token available',
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        loading: prev.submissions.length === 0, // Only show spinner if no data yet
        error: null,
      }));

      const filtersWithPagination: SubmissionFilters = {
        ...finalOptions.filters,
        limit: finalOptions.pageSize,
        offset: finalOptions.pageIndex * finalOptions.pageSize,
      };

      const response = await getSubmissions(filtersWithPagination);

      // Calculate stats client-side from submissions
      const stats = {
        total: response.submissions.length,
        perm: response.submissions.filter((s) => s.perm_enabled).length,
        regular: response.submissions.filter((s) => !s.perm_enabled).length,
        complete: response.submissions.filter((s) => s.completeness_status === 'complete').length,
        partial: response.submissions.filter((s) => s.completeness_status === 'partial').length,
        incomplete: response.submissions.filter((s) => s.completeness_status === 'incomplete').length,
      };

      setState({
        submissions: response.submissions,
        total: response.total,
        loading: false,
        error: null,
        stats,
      });
    } catch (error: any) {
      console.error('Failed to fetch submissions:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch submissions',
      }));
    }
  }, [
    session?.user?.accessToken,
    finalOptions.filters,
    finalOptions.pageIndex,
    finalOptions.pageSize,
  ]);

  // Auto-refresh setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (finalOptions.autoRefresh && finalOptions.refreshInterval > 0) {
      intervalId = setInterval(fetchSubmissions, finalOptions.refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchSubmissions, finalOptions.autoRefresh, finalOptions.refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Get single submission
  const getSubmission = useCallback(
    async (submissionId: string): Promise<Submission | null> => {
      if (!session?.user?.accessToken) return null;

      try {
        const submission = await getSubmissionById(
          submissionId,
          session.user.accessToken
        );
        return submission;
      } catch (error: any) {
        console.error('Failed to fetch submission:', error);
        return null;
      }
    },
    [session?.user?.accessToken]
  );

  // Submit new data
  const submit = useCallback(
    async (payload: SubmitDataPayload) => {
      if (!session?.user?.accessToken) {
        throw new Error('No access token available');
      }

      try {
        const response = await submitData(payload, session.user.accessToken);
        // Refresh list after submission
        setTimeout(() => fetchSubmissions(), 2000);
        return response;
      } catch (error: any) {
        console.error('Failed to submit data:', error);
        throw error;
      }
    },
    [session?.user?.accessToken, fetchSubmissions]
  );

  // Retry failed submission
  const retry = useCallback(
    async (submissionId: string) => {
      if (!session?.user?.accessToken) {
        throw new Error('No access token available');
      }

      try {
        await retrySubmission(submissionId, session.user.accessToken);
        // Refresh list after retry
        setTimeout(() => fetchSubmissions(), 2000);
      } catch (error: any) {
        console.error('Failed to retry submission:', error);
        throw error;
      }
    },
    [session?.user?.accessToken, fetchSubmissions]
  );

  return {
    submissions: state.submissions,
    total: state.total,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    refresh,
    getSubmission,
    submit,
    retry,
  };
};
