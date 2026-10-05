import { api } from '../axios';

export type SubmissionApprovalAction =
  | 'approve'
  | 'reject'
  | 'request_changes'
  | 'escalate';

export interface SubmissionApprovalActor {
  userId: string | null;
  name: string | null;
  email: string | null;
}

export interface SubmissionApprovalLevel {
  approvalId: string;
  workflowId: string;
  stepDefId: string;
  level: number;
  name: string;
  actionType: string | null;
  approverType: string | null;
  approverRole: string | null;
  approverRoles: string[];
  approverUsers: string[];
  status: string;
  rawStatus: string;
  dueAt: string | null;
  actedAt: string | null;
  actor: SubmissionApprovalActor;
  comments: string | null;
}

export interface SubmissionApprovalWorkflow {
  workflowId: string;
  workflowDefinitionId: string | null;
  name: string;
  type: string;
  status: string;
  rawStatus: string;
  currentLevel: number | null;
  totalLevels: number;
  submittedBy: SubmissionApprovalActor;
  initiatedAt: string | null;
  completedAt: string | null;
  levels: SubmissionApprovalLevel[];
}

export interface SubmissionApprovalSummary {
  submissionId: string;
  approvalRequired: boolean;
  approvalStatus: string;
  status: string;
  currentLevel: number | null;
  totalLevels: number;
  workflowCount: number;
  currentApproverType: string | null;
  currentApproverRole: string | null;
  currentApproverUsers: string[];
  lastAction: string | null;
  lastActionAt: string | null;
  workflows: SubmissionApprovalWorkflow[];
}

export interface SubmissionApprovalQueueItem {
  approvalId: string;
  workflowId: string;
  submissionId: string;
  workflowName: string;
  workflowType: string;
  level: number;
  stepName: string;
  actionType: string | null;
  status: string;
  rawStatus: string;
  dueAt: string | null;
  approver: {
    type: string | null;
    role: string | null;
    roles: string[];
    users: string[];
  };
  submittedBy: {
    name: string | null;
    email: string | null;
  };
}

export interface SubmissionApprovalQueueResponse {
  total: number;
  items: SubmissionApprovalQueueItem[];
}

export interface SubmissionApprovalActionResponse {
  approvalId: string;
  submissionId: string;
  workflowId: string;
  stepDefId: string;
  action: SubmissionApprovalAction;
  result: Record<string, unknown>;
  submissionApproval: SubmissionApprovalSummary;
}

export interface SubmissionApprovalBulkResultItem {
  approvalId: string;
  success: boolean;
  submissionId?: string;
  workflowId?: string;
  submissionApproval?: SubmissionApprovalSummary;
  error?: {
    message: string;
    statusCode: number;
  };
}

export interface SubmissionApprovalBulkResponse {
  action: 'approve' | 'reject';
  total: number;
  succeeded: number;
  failed: number;
  results: SubmissionApprovalBulkResultItem[];
}

const postApprovalAction = async (
  approvalId: string,
  action: 'approve' | 'reject' | 'request-changes' | 'escalate',
  payload: Record<string, unknown> = {}
): Promise<SubmissionApprovalActionResponse> => {
  const { data } = await api.post(`/approvals/${approvalId}/${action}`, payload);
  return data;
};

export const getSubmissionApprovalQueue = async (params?: {
  role?: string;
  limit?: number;
}): Promise<SubmissionApprovalQueueResponse> => {
  const { data } = await api.get('/approvals/queue', { params });
  return {
    total: Number(data?.total || 0),
    items: Array.isArray(data?.items) ? data.items : [],
  };
};

export const getSubmissionApprovalDetail = async (
  submissionId: string
): Promise<SubmissionApprovalSummary> => {
  const { data } = await api.get(`/submissions/${submissionId}/approval`);
  return data;
};

export const approveSubmissionApproval = async (
  approvalId: string,
  comments?: string | null
): Promise<SubmissionApprovalActionResponse> =>
  postApprovalAction(approvalId, 'approve', {
    comments: comments || null,
  });

export const rejectSubmissionApproval = async (
  approvalId: string,
  reason?: string | null
): Promise<SubmissionApprovalActionResponse> =>
  postApprovalAction(approvalId, 'reject', {
    reason: reason || null,
  });

export const requestChangesSubmissionApproval = async (
  approvalId: string,
  reason?: string | null
): Promise<SubmissionApprovalActionResponse> =>
  postApprovalAction(approvalId, 'request-changes', {
    reason: reason || null,
  });

export const escalateSubmissionApproval = async (
  approvalId: string,
  reason?: string | null
): Promise<SubmissionApprovalActionResponse> =>
  postApprovalAction(approvalId, 'escalate', {
    reason: reason || null,
  });

export const bulkApproveSubmissionApprovals = async (payload: {
  approvalIds: string[];
  comments?: string | null;
}): Promise<SubmissionApprovalBulkResponse> => {
  const { data } = await api.post('/approvals/bulk/approve', {
    approvalIds: payload.approvalIds,
    comments: payload.comments || null,
  });
  return data;
};

export const bulkRejectSubmissionApprovals = async (payload: {
  approvalIds: string[];
  reason?: string | null;
}): Promise<SubmissionApprovalBulkResponse> => {
  const { data } = await api.post('/approvals/bulk/reject', {
    approvalIds: payload.approvalIds,
    reason: payload.reason || null,
  });
  return data;
};
