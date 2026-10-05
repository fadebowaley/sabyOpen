/**
 * PERM Submission API Service
 * 
 * Handles PERM-specific compliance and submission APIs
 * Note: Backend uses /v1/submissions with perm_enabled filter, not separate /perm-submissions
 */

import { api } from '../axios';
import { Submission, SubmissionFilters, SubmissionApiResponse } from './submissions';

// Export PERM submission type for use in components
export type PERMSubmission = Submission;

export interface ComplianceSummary {
  total_submissions: number;
  total_perm_submissions: number;
  avg_compliance_percentage: number;
  complete_submissions: number;
  partial_submissions: number;
  incomplete_submissions: number;
  nodes_tracked: number;
  months_covered: number;
}

/**
 * GET /v1/submissions?perm_enabled=true
 * List all PERM submissions (uses general submissions endpoint with filter)
 */
export interface PERMSubmissionResponse extends SubmissionApiResponse {
  summary?: {
    total_submissions: number;
    numeric_totals: Record<string, number>;
    boolean_breakdown: Record<string, { true: number; false: number }>;
    latest_submission_at: string | null;
  };
}

export const getPERMSubmissions = async (
  filters?: SubmissionFilters
): Promise<PERMSubmissionResponse> => {
  // Add perm_enabled filter to get only PERM submissions
  const permFilters = { ...filters, perm_enabled: true };
  const { data } = await api.get('/submissions', { params: permFilters });
  
  // 🔧 FIX: Backend returns {success, results, count}, not array directly
  const submissions = data.results || data || [];
  const total = data.count || submissions.length;
  
  console.log('📊 [PERM API] Fetched submissions:', {
    total,
    submissionsCount: submissions.length,
    filters: permFilters,
  });
  
  console.log('🔍 [PERM API] RAW RESPONSE:', {
    'data.results exists': !!data.results,
    'data.count': data.count,
    'submissions array length': submissions.length,
    'first submission': submissions[0],
  });
  
  if (submissions.length === 0) {
    console.warn('⚠️ [PERM API] NO SUBMISSIONS RETURNED! Check:', {
      'Backend response': data,
      'Filters sent': permFilters,
    });
  }
  
  return {
    submissions,
    total,
    limit: filters?.limit,
    offset: filters?.offset,
    summary: data.summary,
  };
};

/**
 * Get compliance summary (calculated client-side)
 * Note: Backend doesn't have /compliance/summary endpoint yet
 */
export const getComplianceSummary = async (): Promise<ComplianceSummary> => {
  // Fetch all PERM submissions (no pagination for accurate stats)
  const { submissions } = await getPERMSubmissions({});
  
  if (submissions.length === 0) {
    return {
      total_submissions: 0,
      total_perm_submissions: 0,
      avg_compliance_percentage: 0,
      complete_submissions: 0,
      partial_submissions: 0,
      incomplete_submissions: 0,
      nodes_tracked: 0,
      months_covered: 0,
    };
  }
  
  // Calculate compliance metrics
  const complete = submissions.filter(
    (s) => s.event_compliance_percentage === 100
  ).length;
  
  const partial = submissions.filter(
    (s) =>
      s.event_compliance_percentage &&
      s.event_compliance_percentage > 0 &&
      s.event_compliance_percentage < 100
  ).length;
  
  const incomplete = submissions.filter(
    (s) => !s.event_compliance_percentage || s.event_compliance_percentage === 0
  ).length;
  
  // Calculate average compliance
  const totalCompliance = submissions.reduce(
    (sum, s) => sum + (s.event_compliance_percentage || 0),
    0
  );
  const avgCompliance = totalCompliance / submissions.length;
  
  // Count unique nodes and months
  const uniqueNodes = new Set(
    submissions.map((s) => s.node_id).filter(Boolean)
  );
  const uniqueMonths = new Set(submissions.map((s) => s.month).filter(Boolean));
  
  return {
    total_submissions: submissions.length,
    total_perm_submissions: submissions.length,
    avg_compliance_percentage: avgCompliance,
    complete_submissions: complete,
    partial_submissions: partial,
    incomplete_submissions: incomplete,
    nodes_tracked: uniqueNodes.size,
    months_covered: uniqueMonths.size,
  };
};

/**
 * Lock PERM submission (TODO: Backend endpoint not implemented yet)
 */
export const lockPERMSubmission = async (submissionId: string): Promise<any> => {
  console.log('🔒 Lock PERM submission:', submissionId);
  // TODO: Backend endpoint not implemented yet
  return { success: true, message: 'Lock endpoint not yet implemented' };
};

/**
 * Unlock PERM submission (TODO: Backend endpoint not implemented yet)
 */
export const unlockPERMSubmission = async (
  submissionId: string
): Promise<any> => {
  console.log('🔓 Unlock PERM submission:', submissionId);
  // TODO: Backend endpoint not implemented yet
  return { success: true, message: 'Unlock endpoint not yet implemented' };
};

/**
 * DELETE /v1/submissions/:id
 * Delete PERM submission (uses general submission delete)
 */
export const deletePERMSubmission = async (
  submissionId: string
): Promise<void> => {
  await api.delete(`/submissions/${submissionId}`);
};

/**
 * Validate PERM data (TODO: Backend endpoint not implemented yet)
 */
export const validatePERMData = async (payload: any): Promise<any> => {
  console.log('✅ Validate PERM data:', payload);
  // TODO: Backend endpoint not implemented yet
  return { valid: true, message: 'Validation endpoint not yet implemented' };
};

/**
 * Get compliance level for percentage
 */
export const getComplianceLevel = (percentage: number): string => {
  if (percentage === 100) return 'complete';
  if (percentage >= 80) return 'good';
  if (percentage >= 40) return 'partial';
  return 'critical';
};
