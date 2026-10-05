import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getProjectAnalytics, getProjectFormStats } from '../api/projectForms';

interface FormMetrics {
  submissions: number;
  views: number;
  conversionRate: number;
  successRate: number;
  avgCompletionTime: number;
  compliance?: number;
  onTimeSubmissions?: number;
  requiredSubmissions?: number;
  lastSubmission?: string;
  // New fields for StatsCard
  totalSubmissions?: number;
  lastUpdated?: string;
  monthsCovered?: number;
  nodesTracked?: number;
}

interface UseFormMetricsReturn {
  metrics: FormMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useFormMetrics = (projectId: string): UseFormMetricsReturn => {
  const [metrics, setMetrics] = useState<FormMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch analytics for this specific project
      const analyticsResponse = await getProjectAnalytics(projectId, token).catch(() => null);

      // Extract metrics from analytics response
      const combinedMetrics: FormMetrics = {
        submissions: analyticsResponse?.data?.submissions || 0,
        views: analyticsResponse?.data?.views || 0,
        conversionRate: analyticsResponse?.data?.conversionRate || 0,
        successRate: analyticsResponse?.data?.successRate || 100,
        avgCompletionTime: analyticsResponse?.data?.avgCompletionTime || 0,
        compliance: analyticsResponse?.data?.compliance,
        onTimeSubmissions: analyticsResponse?.data?.onTimeSubmissions,
        requiredSubmissions: analyticsResponse?.data?.requiredSubmissions,
        lastSubmission: analyticsResponse?.data?.lastSubmission,
        totalSubmissions: analyticsResponse?.data?.submissions || 0,
        lastUpdated: new Date().toISOString(),
      };

      setMetrics(combinedMetrics);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to fetch metrics';
      setError(errorMessage);
      console.error('[useFormMetrics] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
  };
};

