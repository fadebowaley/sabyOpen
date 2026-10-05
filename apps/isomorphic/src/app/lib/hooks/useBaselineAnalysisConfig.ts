'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  baselineAnalysisConfigApi,
  BaselineAnalysisConfig,
  EssentialMetricsConfig,
  CustomFieldAnalysisConfig,
  GlobalSettingsConfig,
  EntityType,
} from '../api/baselineAnalysisConfig';
import toast from 'react-hot-toast';

// Query Keys
export const baselineAnalysisConfigQueryKeys = {
  all: ['baseline-analysis-config'] as const,
  config: (entityType: EntityType) => [...baselineAnalysisConfigQueryKeys.all, entityType] as const,
};

/**
 * Hook to get analysis configuration
 */
export function useBaselineAnalysisConfig(entityType: EntityType, enabled = true) {
  return useQuery({
    queryKey: baselineAnalysisConfigQueryKeys.config(entityType),
    queryFn: () => baselineAnalysisConfigApi.getAnalysisConfig(entityType),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to update essential metrics configuration
 */
export function useUpdateEssentialMetrics(entityType: EntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (essentialMetrics: EssentialMetricsConfig) =>
      baselineAnalysisConfigApi.updateEssentialMetrics(entityType, essentialMetrics),
    onSuccess: () => {
      toast.success('Essential metrics updated successfully');
      queryClient.invalidateQueries({
        queryKey: baselineAnalysisConfigQueryKeys.config(entityType),
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update essential metrics');
    },
  });
}

/**
 * Hook to update custom field analysis configuration
 */
export function useUpdateCustomFieldAnalysis(entityType: EntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fieldId, analysis }: { fieldId: string; analysis: CustomFieldAnalysisConfig }) =>
      baselineAnalysisConfigApi.updateCustomFieldAnalysis(entityType, fieldId, analysis),
    onSuccess: () => {
      toast.success('Custom field analysis updated successfully');
      queryClient.invalidateQueries({
        queryKey: baselineAnalysisConfigQueryKeys.config(entityType),
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update custom field analysis');
    },
  });
}

/**
 * Hook to update global settings
 */
export function useUpdateGlobalSettings(entityType: EntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (globalSettings: GlobalSettingsConfig) =>
      baselineAnalysisConfigApi.updateGlobalSettings(entityType, globalSettings),
    onSuccess: () => {
      toast.success('Global settings updated successfully');
      queryClient.invalidateQueries({
        queryKey: baselineAnalysisConfigQueryKeys.config(entityType),
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update global settings');
    },
  });
}

/**
 * Hook to sync analysis config with tenant config
 */
export function useSyncWithTenantConfig(entityType: EntityType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => baselineAnalysisConfigApi.syncWithTenantConfig(entityType),
    onSuccess: () => {
      toast.success('Analysis config synced with tenant config successfully');
      queryClient.invalidateQueries({
        queryKey: baselineAnalysisConfigQueryKeys.config(entityType),
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to sync with tenant config');
    },
  });
}

/**
 * Combined hook for managing baseline analysis configuration
 */
export function useBaselineAnalysisConfigManager(entityType: EntityType) {
  const config = useBaselineAnalysisConfig(entityType);
  const updateEssentialMetrics = useUpdateEssentialMetrics(entityType);
  const updateCustomFieldAnalysis = useUpdateCustomFieldAnalysis(entityType);
  const updateGlobalSettings = useUpdateGlobalSettings(entityType);
  const syncWithTenantConfig = useSyncWithTenantConfig(entityType);

  return {
    // Data
    config: config.data,
    isLoading: config.isLoading,
    error: config.error,

    // Mutations
    updateEssentialMetrics: updateEssentialMetrics.mutate,
    updateCustomFieldAnalysis: updateCustomFieldAnalysis.mutate,
    updateGlobalSettings: updateGlobalSettings.mutate,
    syncWithTenantConfig: syncWithTenantConfig.mutate,

    // Mutation states
    isUpdatingEssentialMetrics: updateEssentialMetrics.isPending,
    isUpdatingCustomFieldAnalysis: updateCustomFieldAnalysis.isPending,
    isUpdatingGlobalSettings: updateGlobalSettings.isPending,
    isSyncing: syncWithTenantConfig.isPending,

    // Refetch
    refetch: config.refetch,
  };
}

