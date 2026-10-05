/**
 * Activity Log API Service
 * 
 * Handles all activity log-related API calls
 * Endpoints: /v1/submissions/activity-log
 */

import { api } from '../axios';

// ===========================
// TYPES & INTERFACES
// ===========================

export interface LogEntry {
  id?: string;
  tenant_id: string;
  project_id: string;
  project_name: string;
  project_category: string;
  form_id: string;
  user_id: string;
  action: string;
  status: string;
  job_id: string;
  message: string;
  node_id?: string;
  created_at: string;
  updated_at?: string;
  
  // Enhanced fields
  user_name?: string;
  user_firstname?: string;
  user_lastname?: string;
  user_email?: string;
  user_phone?: string;
  node_reference?: string;
  node_name?: string;
  node_city?: string;
  form_reference?: string;
  source?: string;
  processing_time_seconds?: number;
  age_seconds?: number;
  is_recent?: boolean;
}

export interface LogFilters {
  tenant_id?: string;
  project_id?: string;
  form_id?: string;
  user_id?: string;
  node_id?: string;
  action?: string;
  status?: string;
  job_id?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogApiResponse {
  logs: LogEntry[];
  results: LogEntry[]; // For backwards compatibility
  total: number;
  limit?: number;
  offset?: number;
}

export interface UpdateActivityLogPayload {
  status?: string;
  notes?: string;
}

// ===========================
// API FUNCTIONS - READ
// ===========================

/**
 * GET /v1/submissions/activity-log
 * Get all activity logs with filtering
 */
export const getLogs = async (
  filters?: LogFilters
): Promise<LogApiResponse> => {
  const { data } = await api.get('/submissions/activity-log', {
    params: filters,
  });
  
  console.log('📊 [getLogs API] RAW Response data keys:', Object.keys(data));
  console.log('📊 [getLogs API] Response data:', {
    success: data.success,
    total: data.total,
    resultsCount: data.results?.length,
    logsCount: data.logs?.length,
    firstResult: data.results?.[0] ? {
      id: data.results[0].id,
      user_name: data.results[0].user_name,
      user_email: data.results[0].user_email,
      node_reference: data.results[0].node_reference,
      form_reference: data.results[0].form_reference,
      source: data.results[0].source,
      allKeys: Object.keys(data.results[0]),
    } : null,
  });
  
  // Normalize response to have both 'logs' and 'results' for backwards compatibility
  const normalizedResults = data.logs || data.results || [];
  
  console.log('📊 [getLogs API] After normalization:', {
    resultsCount: normalizedResults.length,
    firstResultKeys: normalizedResults[0] ? Object.keys(normalizedResults[0]) : [],
  });
  
  return {
    ...data,
    results: normalizedResults,
    logs: normalizedResults,
    total: data.total || 0,
  };
};

/**
 * GET /v1/submissions/activity-log/summary
 * Get aggregated activity log statistics
 */
export const getLogSummary = async (
  token?: string
): Promise<Record<string, number>> => {
  const options = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
  const { data } = await api.get('/submissions/activity-log/summary', options);
  // Backend wraps response in {success: true, summary: {...}}
  return data.summary || data;
};

/**
 * GET /v1/submissions/activity-log/enhanced
 * Get activity logs with user names, node codes, and form references
 */
export const getEnhancedLogs = async (
  filters?: LogFilters
): Promise<LogApiResponse> => {
  const { data } = await api.get('/submissions/activity-log/enhanced', {
    params: filters,
  });
  return {
    ...data,
    results: data.results || [],
    logs: data.results || [],
    total: data.total || 0,
  };
};

/**
 * GET /v1/submissions/activity-log/recent
 * Get recent activity logs
 */
export const getRecentActivityLogs = async (
  tenantId: string,
  limit: number = 10,
  token: string
): Promise<LogApiResponse> => {
  const { data } = await api.get('/submissions/activity-log/recent', {
    params: { tenant_id: tenantId, limit },
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    ...data,
    results: data.logs || data.results || [],
    logs: data.logs || data.results || [],
  };
};

/**
 * GET /v1/submissions/activity-log/user/:user_id
 * Get activity logs by user
 */
export const getActivityLogsByUser = async (
  userId: string,
  token: string
): Promise<LogApiResponse> => {
  const { data } = await api.get(`/submissions/activity-log/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    ...data,
    results: data.logs || data.results || [],
    logs: data.logs || data.results || [],
  };
};

/**
 * GET /v1/submissions/activity-log/action/:action
 * Get activity logs by action type
 */
export const getActivityLogsByAction = async (
  action: string,
  filters: LogFilters,
  token: string
): Promise<LogApiResponse> => {
  const { data } = await api.get(`/submissions/activity-log/action/${action}`, {
    params: filters,
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    ...data,
    results: data.logs || data.results || [],
    logs: data.logs || data.results || [],
  };
};

/**
 * GET /v1/submissions/activity-log/job/:job_id
 * Get activity logs for a specific job
 */
export const getActivityLogsByJob = async (
  jobId: string,
  tenantId: string,
  token: string
): Promise<LogApiResponse> => {
  const { data } = await api.get(`/submissions/activity-log/job/${jobId}`, {
    params: { tenant_id: tenantId },
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    ...data,
    results: data.logs || data.results || [],
    logs: data.logs || data.results || [],
  };
};

/**
 * Compute metrics from logs (client-side)
 */
export const getLogMetrics = async (
  filters?: LogFilters
): Promise<Record<string, number>> => {
  const { results } = await getLogs(filters);
  const metrics = {
    total: results.length,
    success: results.filter((l) => l.status === 'success').length,
    failed: results.filter((l) => l.status === 'failed').length,
    'in progress': results.filter((l) => l.status === 'in progress').length,
    queued: results.filter((l) => l.status === 'queued').length,
    rejected: results.filter((l) => l.status === 'rejected').length,
  };
  return metrics;
};

// ===========================
// API FUNCTIONS - UPDATE
// ===========================

/**
 * PATCH /v1/submissions/activity-log/:id
 * Update activity log status or notes
 */
export const updateActivityLog = async (
  logId: string,
  updates: UpdateActivityLogPayload,
  token: string
): Promise<LogEntry> => {
  const { data } = await api.patch(
    `/submissions/activity-log/${logId}`,
    updates,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

// ===========================
// API FUNCTIONS - DELETE
// ===========================

/**
 * DELETE /v1/submissions/activity-log/:id
 * Delete single activity log
 */
export const deleteActivityLog = async (
  logId: string,
  token: string
): Promise<void> => {
  const { data } = await api.delete(`/submissions/activity-log/${logId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

/**
 * POST /v1/submissions/activity-log/bulk-delete
 * Bulk delete activity logs
 */
export const bulkDeleteActivityLogs = async (
  logIds: string[],
  token: string
): Promise<void> => {
  const { data } = await api.post(
    '/submissions/activity-log/bulk-delete',
    { ids: logIds },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

// ===========================
// API FUNCTIONS - RETRY
// ===========================

/**
 * POST /v1/submissions/:id/retry
 * Retry a failed submission (updated endpoint)
 */
export const retrySubmission = async (
  submissionId: string,
  token: string
): Promise<any> => {
  const { data } = await api.post(
    `/submissions/${submissionId}/retry`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};
