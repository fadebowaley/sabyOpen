'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  baselineIntelligenceApi, 
  BaselineIntelligence, 
  BaselineInsight, 
  BaselineSummary, 
  BaselineHealthStatus 
} from '../api/baselineIntelligence';
import toast from 'react-hot-toast';

// Query Keys
export const baselineQueryKeys = {
  all: ['baseline'] as const,
  nodeBaseline: (nodeId: string) => [...baselineQueryKeys.all, 'node', nodeId] as const,
  networkBaseline: () => [...baselineQueryKeys.all, 'network'] as const,
  nodeInsights: (nodeId: string) => [...baselineQueryKeys.all, 'insights', 'node', nodeId] as const,
  networkInsights: () => [...baselineQueryKeys.all, 'insights', 'network'] as const,
  summary: () => [...baselineQueryKeys.all, 'summary'] as const,
  health: () => [...baselineQueryKeys.all, 'health'] as const,
  topNodes: (type: string, limit: number) => [...baselineQueryKeys.all, 'top-nodes', type, limit] as const,
  geographicDistribution: () => [...baselineQueryKeys.all, 'geographic-distribution'] as const,
  healthScore: () => [...baselineQueryKeys.all, 'health-score'] as const,
};

// Hook for node baseline
export function useNodeBaseline(nodeId: string, enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.nodeBaseline(nodeId),
    queryFn: () => baselineIntelligenceApi.getNodeBaseline(nodeId),
    enabled: enabled && !!nodeId,
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    gcTime: 30 * 60 * 1000, // 30 minutes (increased from 10)
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // Provide fallback data structure - ensure all required fields exist
    placeholderData: (previousData) => {
      // Return previous data if available, otherwise return safe default
      if (previousData && previousData.metrics) {
        return previousData;
      }
      return {
        _id: '',
        tenantId: '',
        nodeId: nodeId || '',
        type: 'node' as const,
        metrics: {
          totalUsers: 0,
          genderDistribution: { male: 0, female: 0, other: 0 },
          ageDistribution: {},
          workforceComposition: {},
          leadershipToMemberRatio: 0,
          activeInactiveAccounts: { active: 0, inactive: 0 },
          averageAge: 0,
          skillsGrouping: {},
          tenureGrouping: {},
          propertyOwnership: { owned: 0, rented: 0, other: 0 },
          branchAge: 0,
          nodeCategories: {},
          capacityMetrics: { totalCapacity: 0, currentOccupancy: 0, utilizationRate: 0 },
          regionStateDistribution: {},
          nodeTypeGroupings: {},
        },
        insights: [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    },
  });
}

// Hook for network baseline
export function useNetworkBaseline(enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.networkBaseline(),
    queryFn: () => baselineIntelligenceApi.getNetworkBaseline(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    gcTime: 30 * 60 * 1000, // 30 minutes (increased from 10)
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // networkMode inherited from global config (theme-provider.tsx)
    // Provide fallback data structure - ensure all required fields exist
    placeholderData: (previousData) => {
      // Return previous data if available, otherwise return safe default
      if (previousData && previousData.metrics) {
        return previousData;
      }
      return {
        _id: '',
        tenantId: '',
        type: 'network' as const,
        metrics: {
          totalUsers: 0,
          genderDistribution: { male: 0, female: 0, other: 0 },
          ageDistribution: {},
          workforceComposition: {},
          leadershipToMemberRatio: 0,
          activeInactiveAccounts: { active: 0, inactive: 0 },
          averageAge: 0,
          skillsGrouping: {},
          tenureGrouping: {},
          propertyOwnership: { owned: 0, rented: 0, other: 0 },
          branchAge: 0,
          nodeCategories: {},
          capacityMetrics: { totalCapacity: 0, currentOccupancy: 0, utilizationRate: 0 },
          regionStateDistribution: {},
          nodeTypeGroupings: {},
        },
        insights: [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    },
  });
}

// Hook for node insights
export function useNodeInsights(nodeId: string, enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.nodeInsights(nodeId),
    queryFn: () => baselineIntelligenceApi.getNodeInsights(nodeId),
    enabled: enabled && !!nodeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for network insights
export function useNetworkInsights(enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.networkInsights(),
    queryFn: () => baselineIntelligenceApi.getNetworkInsights(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // networkMode inherited from global config (theme-provider.tsx)
  });
}

// Hook for baseline summary
export function useBaselineSummary(enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.summary(),
    queryFn: () => baselineIntelligenceApi.getBaselineSummary(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 2)
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // networkMode inherited from global config (theme-provider.tsx)
    // Provide fallback data
    placeholderData: {
      totalNodes: 0,
      totalUsers: 0,
      lastUpdated: new Date().toISOString(),
      healthScore: 0,
      criticalInsights: 0,
      networkMetrics: {
        totalBranches: 0,
        totalWorkforce: 0,
        regionalDistribution: {},
        avgUtilizationRate: 0,
      },
    },
  });
}

// Hook for health status
export function useBaselineHealth(enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.health(),
    queryFn: () => baselineIntelligenceApi.getHealthStatus(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false, // DISABLED auto-refresh - this was causing issues!
    // networkMode inherited from global config (theme-provider.tsx)
  });
}

// Hook for top nodes by attendance or income
export function useTopNodes(type: 'attendance' | 'income', limit: number = 10, enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.topNodes(type, limit),
    queryFn: () => baselineIntelligenceApi.getTopNodes(type, limit),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: () => [],
  });
}

// Hook for geographic distribution
export function useGeographicDistribution(enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.geographicDistribution(),
    queryFn: () => baselineIntelligenceApi.getGeographicDistribution(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: () => ({
      states: [],
      countries: [],
      top5States: [],
      top5Countries: [],
    }),
  });
}

// Hook for health score
export function useHealthScore(enabled = true) {
  return useQuery({
    queryKey: baselineQueryKeys.healthScore(),
    queryFn: () => baselineIntelligenceApi.getHealthScore(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 2)
    gcTime: 30 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    // networkMode inherited from global config (theme-provider.tsx)
    placeholderData: () => ({
      overallScore: 0,
      indicators: {
        profileCompletion: 0,
        dataQuality: 0,
        growthRate: 0,
        financialHealth: 0,
        engagementRate: 0,
        infrastructureHealth: 0,
      },
      insights: [],
      trend: 'stable' as const,
      trendValue: '0%',
    }),
  });
}

// Hook for recomputing baseline
export function useRecomputeBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => baselineIntelligenceApi.recomputeNodeBaseline(nodeId),
    onSuccess: (data, nodeId) => {
      toast.success('Baseline recomputation started successfully');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: baselineQueryKeys.nodeBaseline(nodeId) });
      queryClient.invalidateQueries({ queryKey: baselineQueryKeys.nodeInsights(nodeId) });
      queryClient.invalidateQueries({ queryKey: baselineQueryKeys.networkBaseline() });
      queryClient.invalidateQueries({ queryKey: baselineQueryKeys.networkInsights() });
      queryClient.invalidateQueries({ queryKey: baselineQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: baselineQueryKeys.health() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to recompute baseline');
    },
  });
}

// Combined hook for dashboard data
export function useBaselineDashboard() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Add debug logging
  useEffect(() => {
    console.log('🔵 useBaselineDashboard hook initialized');
  }, []);
  
  const networkBaseline = useNetworkBaseline();
  const nodeBaseline = useNodeBaseline(selectedNodeId || '', !!selectedNodeId);
  const networkInsights = useNetworkInsights();
  const nodeInsights = useNodeInsights(selectedNodeId || '', !!selectedNodeId);
  const summary = useBaselineSummary();
  const health = useBaselineHealth();

  // Debug query states
  useEffect(() => {
    console.log('📊 Query States:', {
      networkBaseline: networkBaseline.status,
      networkInsights: networkInsights.status,
      summary: summary.status,
      health: health.status,
    });
  }, [networkBaseline.status, networkInsights.status, summary.status, health.status]);

  const isLoading = networkBaseline.isLoading || 
                   summary.isLoading || 
                   health.isLoading ||
                   (selectedNodeId && (nodeBaseline.isLoading || nodeInsights.isLoading));

  const error = networkBaseline.error || 
                summary.error || 
                health.error ||
                (selectedNodeId && (nodeBaseline.error || nodeInsights.error));

  return {
    // Data
    networkBaseline: networkBaseline.data,
    nodeBaseline: nodeBaseline.data,
    networkInsights: networkInsights.data,
    nodeInsights: nodeInsights.data,
    summary: summary.data,
    health: health.data,
    
    // State
    selectedNodeId,
    setSelectedNodeId,
    isLoading,
    error,
    
    // Actions
    refetchAll: () => {
      console.log('🔄 Refetching all baseline data');
      networkBaseline.refetch();
      networkInsights.refetch();
      summary.refetch();
      health.refetch();
      if (selectedNodeId) {
        nodeBaseline.refetch();
        nodeInsights.refetch();
      }
    },
  };
}

// Hook for insights filtering and sorting
export function useInsightsManager(insights: BaselineInsight[] = []) {
  // Ensure insights is always an array
  const safeInsights = Array.isArray(insights) ? insights : [];
  const [filters, setFilters] = useState({
    priority: [] as string[],
    category: [] as string[],
    type: [] as string[],
  });
  const [sortBy, setSortBy] = useState<'priority' | 'category' | 'type'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

  const filteredAndSortedInsights = safeInsights
    .filter(insight => {
      if (filters.priority.length && !filters.priority.includes(insight.priority)) return false;
      if (filters.category.length && !filters.category.includes(insight.category)) return false;
      if (filters.type.length && !filters.type.includes(insight.type)) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'priority') {
        comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
      } else {
        comparison = a[sortBy].localeCompare(b[sortBy]);
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const insightStats = {
    total: safeInsights.length,
    critical: safeInsights.filter(i => i.priority === 'critical').length,
    high: safeInsights.filter(i => i.priority === 'high').length,
    medium: safeInsights.filter(i => i.priority === 'medium').length,
    low: safeInsights.filter(i => i.priority === 'low').length,
    categories: [...new Set(safeInsights.map(i => i.category).filter(Boolean))],
    types: [...new Set(safeInsights.map(i => i.type).filter(Boolean))],
  };

  return {
    insights: filteredAndSortedInsights,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats: insightStats,
    clearFilters: () => setFilters({ priority: [], category: [], type: [] }),
  };
}
