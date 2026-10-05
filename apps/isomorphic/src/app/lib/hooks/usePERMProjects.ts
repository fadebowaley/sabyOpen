/**
 * usePERMProjects Hook
 * 
 * Fetches PERM-enabled projects with their compliance stats
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getProjectForms } from '../api/projectForms';
import type { AnalyticsOverviewStats } from './usePERMCompliance';
import {
  getSubmissionSummary,
  getSubmissionsByStatus,
  type SubmissionSummaryItem,
  type StatusBreakdownItem,
} from '../api/analytics';

export type PERMProjectStatus = 'active' | 'draft' | 'locked';

export interface PERMProject {
  projectId: string;
  projectName: string;
  category: string;
  stats: AnalyticsOverviewStats;
  status: PERMProjectStatus;
  pendingApprovals: number;
  lastUpdated: string;
  workflowEnabled: boolean;
}

interface UsePERMProjectsState {
  projects: PERMProject[];
  loading: boolean;
  error: string | null;
}

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
      acc.totalSubmissions += item.total_submissions || 0;
      acc.permSubmissions += item.perm_submissions || 0;
      acc.submittedCount += item.submitted_count || 0;
      acc.approvedCount += item.approved_count || 0;
      acc.rejectedCount += item.rejected_count || 0;
      acc.pendingCount += item.pending_count || 0;
      acc.booleanTrueTotal += item.boolean_true_total || 0;
      acc.booleanFalseTotal += item.boolean_false_total || 0;
      acc.numericTotal += item.numeric_total_sum || 0;
      acc.complianceWeightedSum +=
        (item.avg_compliance || 0) * (item.total_submissions || 0);

      acc.maxUniqueNodes = Math.max(acc.maxUniqueNodes, item.unique_nodes || 0);
      acc.maxUniqueUsers = Math.max(acc.maxUniqueUsers, item.unique_users || 0);
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

  const statusMap = new Map<string, StatusBreakdownItem>();
  statusBreakdown?.forEach((item) =>
    statusMap.set(item.status?.toLowerCase?.() ?? '', item)
  );

  const totalForAverage = totals.totalSubmissions || 1;
  const averageCompliance = totals.complianceWeightedSum / totalForAverage;

  return {
    totalSubmissions: totals.totalSubmissions,
    permSubmissions: totals.permSubmissions,
    submittedCount: totals.submittedCount,
    approvedCount:
      totals.approvedCount + (statusMap.get('approved')?.count || 0),
    rejectedCount:
      totals.rejectedCount + (statusMap.get('rejected')?.count || 0),
    pendingCount:
      totals.pendingCount + (statusMap.get('pending')?.count || 0),
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

export const usePERMProjects = () => {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;

  const [state, setState] = useState<UsePERMProjectsState>({
    projects: [],
    loading: true,
    error: null,
  });

  const fetchProjects = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      if (!tenantId) {
        throw new Error('Tenant ID is required to load PERM analytics');
      }

      // Fetch all PERM-enabled forms
      const response = await getProjectForms();
      
      console.log('📋 [usePERMProjects] Raw response:', response);
      
      // Backend returns paginated: { results: [], page, limit, totalPages, totalResults }
      const allForms = response?.results || [];
      
      console.log('📋 [usePERMProjects] All forms:', {
        totalResults: response?.totalResults,
        formsCount: allForms.length,
        firstForm: allForms[0],
      });
      
      const permForms = allForms.filter(
        (form: any) =>
          form?.capabilities?.experience?.compliance?.enabled === true
      );

      console.log('📋 [usePERMProjects] Found PERM forms:', permForms.length);

      // Calculate stats for each project
      const projectsWithStats = await Promise.all(
        permForms.map(async (form: any) => {
          const [summaryItems, statusBreakdown] = await Promise.all([
            getSubmissionSummary({
              tenant_id: tenantId,
              project_id: form.projectId,
              group_by: 'month',
            }),
            getSubmissionsByStatus({
              tenant_id: tenantId,
              project_id: form.projectId,
            }),
          ]);

          const stats = buildAnalyticsSummary(
            summaryItems,
            statusBreakdown
          );

          const deploymentStatus = form?.identity?.status;
          const status: PERMProjectStatus =
            deploymentStatus === 'draft'
              ? 'draft'
              : deploymentStatus === 'archived' || form?.status === 'archived'
                ? 'locked'
                : 'active';

          return {
            projectId: form.projectId,
            projectName: form.identity?.name || form.projectId,
            category: form.identity?.category || 'Uncategorized',
            stats,
            status,
            pendingApprovals: stats.pendingCount || 0,
            lastUpdated:
              form.updatedAt || form?.metadata?.lastModified || form.createdAt,
            workflowEnabled:
              Boolean(form?.capabilities?.experience?.compliance?.trackCompliance) ||
              Boolean(form?.capabilities?.experience?.compliance?.autoGenerateCalendar),
          };
        })
      );

      console.log('✅ [usePERMProjects] Projects with stats:', projectsWithStats);

      setState({
        projects: projectsWithStats,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('❌ [usePERMProjects] Error:', error);
      setState({
        projects: [],
        loading: false,
        error: error.message || 'Failed to fetch projects',
      });
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const refresh = useCallback(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects: state.projects,
    loading: state.loading,
    error: state.error,
    refresh,
  };
};
