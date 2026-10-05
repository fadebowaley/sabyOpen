/**
 * Submission API Service
 * 
 * Handles all submission-related API calls including full CRUD
 * Backend endpoint: /v1/submissions
 * Note: Backend returns { success: true, results: [...], count: X }
 */

import { api } from '../axios';

// ===========================
// TYPES & INTERFACES
// ===========================

export interface SubmissionFilters {
  tenant_id?: string;
  project_id?: string;
  form_id?: string;
  node_id?: string;
  user_id?: string;
  month?: string;
  year?: number;
  perm_enabled?: boolean;
  completeness_status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Submission {
  id: string;
  tenant_id: string;
  project_id: string;
  form_id: string;
  node_id?: string;
  user_id?: string;
  source?: string; // Submission source (api, web, mobile, etc.)
  status?: string; // Submission status
  payload: Record<string, any>;
  data?: Record<string, any>; // Backend uses 'data' field
  meta?: Record<string, any>;
  metadata?: Record<string, any>;
  month?: string;
  year?: number;
  perm_enabled?: boolean;
  completeness_status?: string;
  event_compliance_percentage?: number;
  total_events_submitted?: number;
  total_events_required?: number;
  submitted_by?: string;
  submitted_at?: string;
  locked?: boolean; // Is submission locked
  locked_by?: string; // Who locked it
  paymentSettlement?: {
    payment?: {
      id?: string;
      reference?: string | null;
      status?: string | null;
      amount?: number | null;
      total?: number | null;
      currency?: string | null;
      paymentMethod?: string | null;
      providerRef?: string | null;
      completedAt?: string | null;
    } | null;
    settlement?: {
      id?: string;
      paymentReference?: string | null;
      status?: string | null;
      availabilityStatus?: string | null;
      fundingStatus?: string | null;
      guardrailStatus?: string | null;
      guardrailReason?: string | null;
      provider?: string | null;
      currency?: string | null;
      amount?: number | null;
      netAmount?: number | null;
      destinationType?: string | null;
      destinationNodeId?: string | null;
      destinationNodeReference?: string | null;
      destinationNodeName?: string | null;
      sourceNodeId?: string | null;
      sourceNodeReference?: string | null;
      sourceNodeName?: string | null;
      targetLevelId?: string | null;
      destinationAccount?: {
        bankName?: string | null;
        accountName?: string | null;
        accountNumber?: string | null;
      } | null;
      providerSettlementId?: string | null;
      providerSettledAt?: string | null;
      providerTransferId?: string | null;
      attempts?: number;
      failureReason?: string | null;
    } | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionApiResponse {
  submissions: Submission[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface UpdateSubmissionPayload {
  data?: Record<string, any>;
  payload?: Record<string, any>;
  status?: string;
  meta?: any;
}

// ===========================
// API FUNCTIONS - READ
// ===========================

/**
 * GET /v1/submissions
 * List all submissions with filtering and pagination
 */
export const getSubmissions = async (
  filters?: SubmissionFilters
): Promise<SubmissionApiResponse> => {
  const { data } = await api.get('/submissions', { params: filters });
  
  console.log('🔍 [submissions.ts] API Response:', data);
  
  // Backend returns { success: true, results: [...], count: X }
  const submissions = data.results || data.submissions || (Array.isArray(data) ? data : []);
  const total = data.count || data.total || submissions.length;
  
  console.log('📊 [submissions.ts] Parsed:', {
    submissionsCount: submissions.length,
    total,
    hasResults: !!data.results,
    isArray: Array.isArray(data),
  });
  
  return {
    submissions,
    total,
    limit: filters?.limit,
    offset: filters?.offset,
  };
};

/**
 * GET /v1/submissions/:id
 * Get specific submission by ID
 */
export const getSubmissionById = async (id: string): Promise<Submission> => {
  const { data } = await api.get(`/submissions/${id}`);
  // Backend returns { success: true, submission: {...} } or just {...}
  return data.submission || data;
};

/**
 * GET /v1/submissions/stats
 * Get submissions statistics (client-side calculation)
 */
export const getSubmissionStats = async (
  filters?: SubmissionFilters
): Promise<Record<string, number>> => {
  // Remove pagination for accurate stats
  const statsFilters = { ...filters };
  delete statsFilters.limit;
  delete statsFilters.offset;
  
  const { submissions } = await getSubmissions(statsFilters);
  
  const stats = {
    total: submissions.length,
    complete: submissions.filter((s) => s.completeness_status === 'complete')
      .length,
    partial: submissions.filter((s) => s.completeness_status === 'partial')
      .length,
    incomplete: submissions.filter(
      (s) => s.completeness_status === 'incomplete'
    ).length,
    perm: submissions.filter((s) => s.perm_enabled).length,
  };
  
  return stats;
};

// ===========================
// API FUNCTIONS - CREATE
// ===========================

/**
 * POST /v1/submissions
 * Submit new data (PERM or regular)
 */
export const submitData = async (payload: any): Promise<any> => {
  const { data } = await api.post('/submissions', payload);
  return data;
};

// ===========================
// API FUNCTIONS - UPDATE
// ===========================

/**
 * PATCH /v1/submissions/:id
 * Update submission data
 */
export const updateSubmission = async (
  submissionId: string,
  payload: UpdateSubmissionPayload
): Promise<Submission> => {
  console.log('📝 [submissions.ts] Updating submission:', submissionId, payload);
  const { data } = await api.patch(`/submissions/${submissionId}`, payload);
  return data.submission || data;
};

/**
 * POST /v1/submissions/:id/retry
 * Retry a failed submission
 */
export const retrySubmission = async (submissionId: string): Promise<any> => {
  console.log('🔄 [submissions.ts] Retrying submission:', submissionId);
  const { data } = await api.post(`/submissions/${submissionId}/retry`);
  return data;
};

// ===========================
// API FUNCTIONS - DELETE
// ===========================

/**
 * DELETE /v1/submissions/:id
 * Delete a submission
 */
export const deleteSubmission = async (submissionId: string): Promise<void> => {
  console.log('🗑️ [submissions.ts] Deleting submission:', submissionId);
  await api.delete(`/submissions/${submissionId}`);
};

/**
 * POST /v1/submissions/bulk-delete
 * Delete multiple submissions
 */
export const bulkDeleteSubmissions = async (
  submissionIds: string[]
): Promise<void> => {
  console.log('🗑️ [submissions.ts] Bulk deleting submissions:', submissionIds.length);
  await api.post('/submissions/bulk-delete', { ids: submissionIds });
};
