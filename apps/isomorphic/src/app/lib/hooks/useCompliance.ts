'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  complianceApi,
  ComplianceTableItem,
  ComplianceSummary,
  ComplianceFilters,
  CompliancePagination,
  ComplianceScore,
} from '../api/compliance';
import toast from 'react-hot-toast';

// Query Keys
export const complianceQueryKeys = {
  all: ['compliance'] as const,
  table: (filters: ComplianceFilters, pagination: CompliancePagination) =>
    [...complianceQueryKeys.all, 'table', filters, pagination] as const,
  summary: () => [...complianceQueryKeys.all, 'summary'] as const,
  userScore: (userId: string, nodeId?: string | null) =>
    [...complianceQueryKeys.all, 'user-score', userId, nodeId] as const,
};

/**
 * Hook for fetching compliance table with pagination and filters
 */
export function useComplianceTable(
  filters: ComplianceFilters = {},
  pagination: CompliancePagination = {},
  enabled = true
) {
  return useQuery({
    queryKey: complianceQueryKeys.table(filters, pagination),
    queryFn: () => complianceApi.getComplianceTable(filters, pagination),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (increased from 2)
    gcTime: 15 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    placeholderData: () => ({
      data: [],
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 25,
        total: 0,
        totalPages: 0,
      },
    }),
  });
}

/**
 * Hook for fetching compliance summary
 */
export function useComplianceSummary(enabled = true) {
  return useQuery({
    queryKey: complianceQueryKeys.summary(),
    queryFn: () => complianceApi.getComplianceSummary(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (increased from 2)
    gcTime: 15 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    placeholderData: () => ({
      totalUsers: 0,
      totalCompliant: 0,
      totalNonCompliant: 0,
      totalPartial: 0,
      averageCompliance: 0,
      complianceRate: 0,
    }),
  });
}

/**
 * Hook for fetching user compliance score
 */
export function useUserComplianceScore(
  userId: string,
  nodeId?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: complianceQueryKeys.userScore(userId, nodeId),
    queryFn: () => complianceApi.getUserComplianceScore(userId, nodeId),
    enabled: enabled && !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for updating user compliance status
 */
export function useUpdateUserCompliance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, profileUpdateCompliant }: { userId: string; profileUpdateCompliant: boolean }) =>
      complianceApi.updateUserCompliance(userId, profileUpdateCompliant),
    onSuccess: (data, variables) => {
      toast.success(
        variables.profileUpdateCompliant
          ? 'User profile marked as compliant'
          : 'User profile compliance removed'
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: complianceQueryKeys.userScore(variables.userId),
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to update user compliance'
      );
    },
  });
}

/**
 * Hook for updating node compliance status
 */
export function useUpdateNodeCompliance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ nodeId, profileUpdateCompliant }: { nodeId: string; profileUpdateCompliant: boolean }) =>
      complianceApi.updateNodeCompliance(nodeId, profileUpdateCompliant),
    onSuccess: (data, variables) => {
      toast.success(
        variables.profileUpdateCompliant
          ? 'Node profile marked as compliant'
          : 'Node profile compliance removed'
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.all });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to update node compliance'
      );
    },
  });
}

/**
 * Combined hook for compliance management
 */
export function useComplianceManager(
  filters: ComplianceFilters = {},
  pagination: CompliancePagination = {}
) {
  const complianceTable = useComplianceTable(filters, pagination);
  const complianceSummary = useComplianceSummary();
  const updateUserCompliance = useUpdateUserCompliance();
  const updateNodeCompliance = useUpdateNodeCompliance();

  const handleToggleUserCompliance = async (
    userId: string,
    currentStatus: boolean
  ) => {
    await updateUserCompliance.mutateAsync({
      userId,
      profileUpdateCompliant: !currentStatus,
    });
  };

  const handleToggleNodeCompliance = async (
    nodeId: string,
    currentStatus: boolean
  ) => {
    await updateNodeCompliance.mutateAsync({
      nodeId,
      profileUpdateCompliant: !currentStatus,
    });
  };

  return {
    // Data
    table: complianceTable.data,
    summary: complianceSummary.data,

    // Loading states
    isLoading: complianceTable.isLoading || complianceSummary.isLoading,
    isUpdating: updateUserCompliance.isPending || updateNodeCompliance.isPending,

    // Errors
    error: complianceTable.error || complianceSummary.error,

    // Actions
    toggleUserCompliance: handleToggleUserCompliance,
    toggleNodeCompliance: handleToggleNodeCompliance,
    refetch: () => {
      complianceTable.refetch();
      complianceSummary.refetch();
    },
  };
}

