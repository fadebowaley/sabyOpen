/**
 * usePERMCompliance Hook
 * 
 * Custom hook for managing PERM compliance data
 * Pattern: Copy from useSubmissions.ts
 */

'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  getPERMSubmissions,
  validatePERMData,
  lockPERMSubmission,
  unlockPERMSubmission,
  deletePERMSubmission,
  getComplianceLevel,
  type PERMSubmissionResponse,
} from '../api/perm';
import {
  getSubmissionSummary,
  getSubmissionsByStatus,
  getSubmissionsByMonth,
  type SubmissionSummaryItem,
  type StatusBreakdownItem,
  type MonthBreakdownItem,
} from '../api/analytics';
import type { Submission, SubmissionFilters } from '../api/submissions';

// Type aliases for PERM submissions
type PERMSubmission = Submission;
type PERMFilters = SubmissionFilters;

export interface AnalyticsOverviewStats {
  totalSubmissions: number;
  permSubmissions: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  averageCompliance: number;
  uniqueNodes: number;
  uniqueUsers: number;
  booleanTrueTotal: number;
  booleanFalseTotal: number;
  numericTotal: number;
}

interface UsePERMComplianceOptions {
  filters?: PERMFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageIndex?: number;
  pageSize?: number;
}

interface PERMComplianceState {
  submissions: PERMSubmission[];
  total: number;
  analyticsSummary: AnalyticsOverviewStats | null;
  summaryItems: SubmissionSummaryItem[];
  statusBreakdown: StatusBreakdownItem[];
  monthlyBreakdown: MonthBreakdownItem[];
  loading: boolean;
  error: string | null;
  submissionSummary: PERMSubmissionResponse['summary'] | null;
}

const DEFAULT_OPTIONS: Required<UsePERMComplianceOptions> = {
  filters: {},
  autoRefresh: false,
  refreshInterval: 60000, // 60 seconds
  pageIndex: 0,
  pageSize: 25,
};

export const usePERMCompliance = (options: UsePERMComplianceOptions = {}) => {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;

  // Memoize final options
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

  const [state, setState] = useState<PERMComplianceState>({
    submissions: [],
    total: 0,
    analyticsSummary: null,
    summaryItems: [],
    statusBreakdown: [],
    monthlyBreakdown: [],
    loading: true,
    error: null,
    submissionSummary: null,
  });

  const buildAnalyticsSummary = (
    summaryItems: SubmissionSummaryItem[],
    statusBreakdown: StatusBreakdownItem[]
  ): AnalyticsOverviewStats => {
    if (!summaryItems?.length) {
      return {
        totalSubmissions: 0,
        permSubmissions: 0,
        submittedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        averageCompliance: 0,
        uniqueNodes: 0,
        uniqueUsers: 0,
        booleanTrueTotal: 0,
        booleanFalseTotal: 0,
        numericTotal: 0,
      };
    }

    const totals = summaryItems.reduce(
      (acc, item) => {
        acc.totalSubmissions += item.total_submissions;
        acc.permSubmissions += item.perm_submissions;
        acc.submittedCount += item.submitted_count;
        acc.approvedCount += item.approved_count;
        acc.rejectedCount += item.rejected_count;
        acc.pendingCount += item.pending_count;
        acc.booleanTrueTotal += item.boolean_true_total;
        acc.booleanFalseTotal += item.boolean_false_total;
        acc.numericTotal += item.numeric_total_sum;

        acc.complianceWeightedSum += item.avg_compliance * item.total_submissions;
        acc.maxUniqueNodes = Math.max(acc.maxUniqueNodes, item.unique_nodes);
        acc.maxUniqueUsers = Math.max(acc.maxUniqueUsers, item.unique_users);
        return acc;
      },
      {
        totalSubmissions: 0,
        permSubmissions: 0,
        submittedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        booleanTrueTotal: 0,
        booleanFalseTotal: 0,
        numericTotal: 0,
        complianceWeightedSum: 0,
        maxUniqueNodes: 0,
        maxUniqueUsers: 0,
      }
    );

    const totalForAverage = totals.totalSubmissions || 1;
    const averageCompliance = totals.complianceWeightedSum / totalForAverage;

    // Include status-based adjustments if available
    const statusMap = new Map<string, StatusBreakdownItem>();
    statusBreakdown.forEach((item) => {
      statusMap.set(item.status.toLowerCase(), item);
    });

    return {
      totalSubmissions: totals.totalSubmissions,
      permSubmissions: totals.permSubmissions,
      submittedCount: totals.submittedCount,
      approvedCount:
        totals.approvedCount +
        (statusMap.get('approved')?.count ?? 0),
      rejectedCount:
        totals.rejectedCount +
        (statusMap.get('rejected')?.count ?? 0),
      pendingCount:
        totals.pendingCount +
        (statusMap.get('pending')?.count ?? 0),
      averageCompliance: Number.isFinite(averageCompliance)
        ? Number(averageCompliance.toFixed(2))
        : 0,
      uniqueNodes: totals.maxUniqueNodes,
      uniqueUsers: totals.maxUniqueUsers,
      booleanTrueTotal: totals.booleanTrueTotal,
      booleanFalseTotal: totals.booleanFalseTotal,
      numericTotal: totals.numericTotal,
    };
  };

  // Fetch PERM data and summary
  const fetchData = useCallback(async () => {
    if (!session?.user?.accessToken) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'No access token available',
      }));
      return;
    }

    if (!tenantId) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Tenant ID is required for analytics',
      }));
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        loading: prev.submissions.length === 0,
        error: null,
      }));

      const filtersWithPagination: PERMFilters = {
        ...finalOptions.filters,
        limit: finalOptions.pageSize,
        offset: finalOptions.pageIndex * finalOptions.pageSize,
      };

      console.log('🔄 [usePERMCompliance] Fetching data with filters:', filtersWithPagination);

      const analyticsFilters: AnalyticsFilters = {
        tenant_id: tenantId,
        project_id: finalOptions.filters.project_id,
        start_date: finalOptions.filters?.start_date,
        end_date: finalOptions.filters?.end_date,
      };

      const [submissionsData, summaryItems, statusBreakdown, monthlyBreakdown] =
        await Promise.all([
        getPERMSubmissions(filtersWithPagination),
        getSubmissionSummary({
          ...analyticsFilters,
          group_by: 'month',
        }),
        getSubmissionsByStatus(analyticsFilters),
        getSubmissionsByMonth({
          ...analyticsFilters,
          year: finalOptions.filters?.year,
        }),
      ]);

      console.log('✅ [usePERMCompliance] Data fetched:', {
        submissions: submissionsData.submissions.length,
        total: submissionsData.total,
      });

      const analyticsSummary = buildAnalyticsSummary(
        summaryItems,
        statusBreakdown
      );

      setState({
        submissions: submissionsData.submissions || [],
        total: submissionsData.total || 0,
        analyticsSummary,
        summaryItems,
        statusBreakdown,
        monthlyBreakdown,
        loading: false,
        error: null,
        submissionSummary: submissionsData.summary || null,
      });
    } catch (error: any) {
      console.error('Failed to fetch PERM compliance data:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch PERM data',
      }));
    }
  }, [
    session?.user?.accessToken,
    tenantId,
    finalOptions.filters,
    finalOptions.pageIndex,
    finalOptions.pageSize,
  ]);

  // Auto-refresh setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (finalOptions.autoRefresh && finalOptions.refreshInterval > 0) {
      intervalId = setInterval(fetchData, finalOptions.refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchData, finalOptions.autoRefresh, finalOptions.refreshInterval]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Get submission by node and month
  const getByNodeMonth = useCallback(
    async (nodeId: string, month: string): Promise<PERMSubmission | null> => {
      if (!session?.user?.accessToken) return null;

      try {
        // Fetch submissions with node_id and month filters
        const { submissions } = await getPERMSubmissions({
          node_id: nodeId,
          month: month,
        });
        return submissions[0] || null;
      } catch (error: any) {
        console.error('Failed to fetch PERM submission:', error);
        return null;
      }
    },
    [session?.user?.accessToken]
  );

  // Validate PERM data
  const validate = useCallback(
    async (payload: any) => {
      if (!session?.user?.accessToken) {
        throw new Error('No access token available');
      }

      try {
        const result = await validatePERMData(payload);
        return result;
      } catch (error: any) {
        console.error('Failed to validate PERM data:', error);
        throw error;
      }
    },
    [session?.user?.accessToken]
  );

  // Lock submission
  const lock = useCallback(
    async (submissionId: string) => {
      if (!session?.user?.accessToken) {
        throw new Error('No access token available');
      }

      try {
        await lockPERMSubmission(submissionId);
        refresh();
      } catch (error: any) {
        console.error('Failed to lock submission:', error);
        throw error;
      }
    },
    [session?.user?.accessToken, refresh]
  );

  // Unlock submission
  const unlock = useCallback(
    async (submissionId: string) => {
      if (!session?.user?.accessToken) {
        throw new Error('No access token available');
      }

      try {
        await unlockPERMSubmission(submissionId);
        refresh();
      } catch (error: any) {
        console.error('Failed to unlock submission:', error);
        throw error;
      }
    },
    [session?.user?.accessToken, refresh]
  );

  // Delete submission
  const deleteSubmission = useCallback(
    async (submissionId: string) => {
      if (!session?.user?.accessToken) {
        throw new Error('No access token available');
      }

      try {
        await deletePERMSubmission(submissionId);
        refresh();
      } catch (error: any) {
        console.error('Failed to delete submission:', error);
        throw error;
      }
    },
    [session?.user?.accessToken, refresh]
  );

  return {
    submissions: state.submissions,
    total: state.total,
    analyticsSummary: state.analyticsSummary,
    summaryItems: state.summaryItems,
    statusBreakdown: state.statusBreakdown,
    monthlyBreakdown: state.monthlyBreakdown,
    submissionSummary: state.submissionSummary,
    loading: state.loading,
    error: state.error,
    refresh,
    getByNodeMonth,
    validate,
    lock,
    unlock,
    deleteSubmission,
    getComplianceLevel, // Export helper function
  };
};

