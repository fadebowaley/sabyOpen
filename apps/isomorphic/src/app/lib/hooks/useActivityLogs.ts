'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { getLogs, LogEntry, LogFilters, getLogSummary } from '../api/logs';
import { resolveSocketBaseUrl } from '../api/base-url';

interface ActivityLogsState {
  logs: LogEntry[];
  metrics: Record<string, number>;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

interface UseActivityLogsOptions {
  filters?: LogFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageIndex?: number;
  pageSize?: number;
}

const DEFAULT_OPTIONS: Required<UseActivityLogsOptions> = {
  filters: {},
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  pageIndex: 0,
  pageSize: 25,
};

export const useActivityLogs = (options: UseActivityLogsOptions = {}) => {
  const { data: session } = useSession();
  
  // Memoize final options to prevent infinite re-renders
  const finalOptions = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [
    options.filters,
    options.autoRefresh,
    options.refreshInterval,
    options.pageIndex,
    options.pageSize,
  ]);

  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [state, setState] = useState<ActivityLogsState>({
    logs: [],
    metrics: {},
    loading: true,
    error: null,
    isConnected: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Fetch logs, metrics, and summary from API
  const fetchData = useCallback(async () => {
    console.log('[useActivityLogs] fetchData called with pageIndex:', finalOptions.pageIndex, 'pageSize:', finalOptions.pageSize);
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
        loading: prev.logs.length === 0, // Only show loading spinner if no data yet
        error: null,
      }));

      const filtersWithPagination = {
        ...finalOptions.filters,
        limit: finalOptions.pageSize,
        offset: finalOptions.pageIndex * finalOptions.pageSize,
      };
      console.log('[useActivityLogs] filtersWithPagination:', filtersWithPagination);

      // Get logs with denormalized data (user names, node codes, form references)
      const [logsResponse, summaryData] = await Promise.all([
        getLogs(filtersWithPagination),
        getLogSummary(session.user.accessToken),
      ]);

      console.log('📊 [useActivityLogs] Received logs:', {
        count: logsResponse.results?.length,
        total: logsResponse.total,
        firstLog: logsResponse.results?.[0] ? {
          user_name: logsResponse.results[0].user_name,
          user_email: logsResponse.results[0].user_email,
          user_phone: logsResponse.results[0].user_phone,
          node_reference: logsResponse.results[0].node_reference,
          node_name: logsResponse.results[0].node_name,
          form_reference: logsResponse.results[0].form_reference,
          source: logsResponse.results[0].source,
        } : null,
      });

      setState((prev) => ({
        ...prev,
        logs: logsResponse.results,
        metrics: summaryData, // Use summary as metrics
        loading: false,
        error: null,
      }));
      setTotal(logsResponse.total || 0);
      setSummary(summaryData || {});
    } catch (error: any) {
      console.error('Failed to fetch activity logs:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch activity logs',
      }));
    }
  }, [
    session?.user?.accessToken,
    finalOptions.filters,
    finalOptions.pageIndex,
    finalOptions.pageSize,
  ]);

  // Connect to WebSocket for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!session?.user?.accessToken || socketRef.current?.connected) {
      return;
    }

    try {
      const backendUrl = resolveSocketBaseUrl();
      if (!backendUrl) {
        throw new Error('WebSocket backend URL is not configured');
      }

      socketRef.current = io(backendUrl, {
        auth: {
          token: session.user.accessToken,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      socketRef.current.on('connect', () => {
        console.log('🔌 WebSocket connected for activity logs');
        setState((prev) => ({ ...prev, isConnected: true }));
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected from activity logs');
        setState((prev) => ({ ...prev, isConnected: false }));
      });

      socketRef.current.on('activity-update', (newActivity: LogEntry) => {
        console.log('📡 Received real-time activity update:', newActivity);

        setState((prev) => {
          // Add new activity to the beginning of the list
          const updatedLogs = [newActivity, ...prev.logs];

          // Update metrics
          const updatedMetrics = { ...prev.metrics };
          updatedMetrics.total = updatedLogs.length;

          // Update status-specific counts
          const status = newActivity.status;
          if (status in updatedMetrics) {
            updatedMetrics[status]++;
          }

          return {
            ...prev,
            logs: updatedLogs,
            metrics: updatedMetrics,
          };
        });
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: 'Failed to connect to real-time updates',
        }));
      });
    } catch (error: any) {
      console.error('Failed to connect WebSocket:', error);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: 'Failed to connect to real-time updates',
      }));
    }
  }, [session?.user?.accessToken]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState((prev) => ({ ...prev, isConnected: false }));
    }
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    if (finalOptions.autoRefresh && finalOptions.refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(
        fetchData,
        finalOptions.refreshInterval
      );
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchData, finalOptions.autoRefresh, finalOptions.refreshInterval]);

  // Initial data fetch and WebSocket connection
  useEffect(() => {
    fetchData();
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [fetchData, connectWebSocket, disconnectWebSocket]);

  // Reconnect WebSocket when session changes
  useEffect(() => {
    if (session?.user?.accessToken) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
  }, [session?.user?.accessToken, connectWebSocket, disconnectWebSocket]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Update filters
  const updateFilters = useCallback(
    (newFilters: LogFilters) => {
      finalOptions.filters = { ...finalOptions.filters, ...newFilters };
      fetchData();
    },
    [fetchData]
  );

  return {
    ...state,
    refresh,
    updateFilters,
    reconnect: connectWebSocket,
    total,
    summary,
  };
};
