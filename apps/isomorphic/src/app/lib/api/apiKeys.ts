import { api } from '../axios';

// Types for API keys
export interface ApiKey {
  _id: string;
  id: string;
  name?: string;
  label: string;
  hashedKey?: string;
  key: string; // Truncated for display
  status: 'active' | 'inactive' | 'expired' | 'pending-approval';
  lastUsed: string;
  created: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  expires?: string;
  permissions: string[];
  category: 'web' | 'api' | 'mobile' | 'internal' | 'external' | 'partner' | 'system';
  scope: string; // Deprecated
  usageCount: number;
  rateLimit: number;
  environment: 'production' | 'staging';
  isActive: boolean;
  tenant: string;
  lastUsedAt?: string;
  // NEW FIELDS FOR APPROVAL WORKFLOW
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'auto-approved';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  requestedBy?: string;
  createdBy?:
    | string
    | {
        id?: string;
        _id?: string;
        firstname?: string;
        lastname?: string;
        email?: string;
      };
  isProductionReady?: boolean;
  pendingApproval?: boolean;
  message?: string;
}

export interface ApiKeyFilters {
  page?: number;
  limit?: number;
  environment?: 'production' | 'development' | 'staging';
  isActive?: boolean;
  category?: 'web' | 'api' | 'mobile' | 'internal' | 'external' | 'partner' | 'system';
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'auto-approved';
  scope?: string; // Deprecated
  sortBy?: string;
  tenant?: string;
}

export interface CreateApiKeyPayload {
  label: string;
  environment: 'production' | 'staging';
  category: 'web' | 'api' | 'mobile' | 'internal' | 'external' | 'partner' | 'system';
  scope?: string; // Deprecated
  permissions?: string[];
  rateLimit?: number;
  expires?: string;
}

export interface UpdateApiKeyPayload {
  label?: string;
  isActive?: boolean;
  permissions?: string[];
  rateLimit?: number;
  expires?: string | null;
}

export interface ApiKeyAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimit: number;
  currentPeriodUsage: number;
  lastUsed?: string;
  requestsOverTime: Array<{
    timestamp: string;
    count: number;
  }>;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
  permissions: string[];
  scope: string;
  environment: string;
  createdAt: string;
  expiresAt?: string;
}

export interface PaginatedApiKeysResponse {
  results: ApiKey[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  rawKey: string;
}

// NEW: API Key Approval types
export interface ApiKeyApproval {
  id: string; // Backend toJSON plugin converts _id to id
  _id?: string; // Fallback for compatibility
  apiKey: ApiKey;
  tenant: string;
  requestedBy: {
    id: string;
    _id?: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: {
    id: string;
    _id?: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  approvedAt?: string;
  rejectedBy?: {
    id: string;
    _id?: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  requestDetails: {
    label: string;
    category: string;
    environment: string;
    permissions: string[];
    rateLimit: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedApprovalsResponse {
  results: ApiKeyApproval[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

// Auth headers helper
const authHeaders = (token?: string) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});

/**
 * Get all API keys for the tenant with optional filtering
 */
export const getApiKeys = async (
  filters?: ApiKeyFilters,
  token?: string
): Promise<PaginatedApiKeysResponse> => {
  const { data } = await api.get('/api-keys', {
    params: filters,
    ...authHeaders(token),
  });
  return data;
};

/**
 * Create a new API key
 */
export const createApiKey = async (
  payload: CreateApiKeyPayload,
  token?: string
): Promise<CreateApiKeyResponse> => {
  const { data } = await api.post('/api-keys', payload, authHeaders(token));
  return data;
};

/**
 * Get a specific API key by ID
 */
export const getApiKeyById = async (
  keyId: string,
  token?: string
): Promise<ApiKey> => {
  const { data } = await api.get(`/api-keys/${keyId}`, authHeaders(token));
  return data;
};

/**
 * Update an existing API key
 */
export const updateApiKey = async (
  keyId: string,
  payload: UpdateApiKeyPayload,
  token?: string
): Promise<ApiKey> => {
  const { data } = await api.patch(
    `/api-keys/${keyId}`,
    payload,
    authHeaders(token)
  );
  return data;
};

/**
 * Delete an API key
 */
export const deleteApiKey = async (
  keyId: string,
  token?: string
): Promise<void> => {
  await api.delete(`/api-keys/${keyId}`, authHeaders(token));
};

/**
 * Get API key usage analytics
 */
export const getApiKeyAnalytics = async (
  keyId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
  },
  token?: string
): Promise<ApiKeyAnalytics> => {
  const { data } = await api.get(`/api-keys/${keyId}/analytics`, {
    params: options,
    ...authHeaders(token),
  });
  return data;
};

/**
 * Regenerate an API key
 */
export const regenerateApiKey = async (
  keyId: string,
  token?: string
): Promise<CreateApiKeyResponse> => {
  const { data } = await api.post(
    `/api-keys/${keyId}/regenerate`,
    {},
    authHeaders(token)
  );
  return data;
};

/**
 * Helper function to format API key for display
 */
export const formatApiKeyForDisplay = (apiKey: ApiKey): ApiKey => {
  return {
    ...apiKey,
    id: apiKey._id || apiKey.id,
    name: apiKey.label, // For compatibility with existing frontend
    key: apiKey.key,
    status: apiKey.status,
    lastUsed: apiKey.lastUsed || 'Never',
    created: apiKey.created || apiKey.createdAt,
    expiresAt: apiKey.expiresAt || apiKey.expires,
  };
};

/**
 * Batch operations for multiple API keys
 */
export const batchUpdateApiKeys = async (
  updates: Array<{ keyId: string; payload: UpdateApiKeyPayload }>,
  token?: string
): Promise<ApiKey[]> => {
  const promises = updates.map(({ keyId, payload }) =>
    updateApiKey(keyId, payload, token)
  );
  return Promise.all(promises);
};

export const batchDeleteApiKeys = async (
  keyIds: string[],
  token?: string
): Promise<void> => {
  const promises = keyIds.map((keyId) => deleteApiKey(keyId, token));
  await Promise.all(promises);
};

/**
 * Get pending API key approvals (SabyUser only)
 */
export const getPendingApprovals = async (
  filters?: { page?: number; limit?: number; tenant?: string; category?: string },
  token?: string
): Promise<PaginatedApprovalsResponse> => {
  const { data } = await api.get('/api-key-approvals/pending', {
    params: filters,
    ...authHeaders(token),
  });
  return data;
};

/**
 * Get all API key approvals with filters (SabyUser only)
 */
export const getApprovals = async (
  filters?: { page?: number; limit?: number; tenant?: string; status?: string; category?: string },
  token?: string
): Promise<PaginatedApprovalsResponse> => {
  const { data } = await api.get('/api-key-approvals', {
    params: filters,
    ...authHeaders(token),
  });
  return data;
};

/**
 * Approve an API key (SabyUser only)
 */
export const approveApiKey = async (
  approvalId: string,
  notes?: string,
  token?: string
): Promise<{ message: string; approval: ApiKeyApproval }> => {
  // Validate approvalId is not undefined/null
  if (!approvalId || approvalId === 'undefined') {
    throw new Error('Invalid approval ID');
  }
  
  console.log('🔍 Approving API Key:', { approvalId, notes });
  
  const { data } = await api.post(
    `/api-key-approvals/${approvalId}/approve`,
    { notes },
    authHeaders(token)
  );
  return data;
};

/**
 * Reject an API key (SabyUser only)
 */
export const rejectApiKey = async (
  approvalId: string,
  reason: string,
  token?: string
): Promise<{ message: string; approval: ApiKeyApproval }> => {
  // Validate approvalId is not undefined/null
  if (!approvalId || approvalId === 'undefined') {
    throw new Error('Invalid approval ID');
  }
  
  console.log('🔍 Rejecting API Key:', { approvalId, reason });
  
  const { data } = await api.post(
    `/api-key-approvals/${approvalId}/reject`,
    { reason },
    authHeaders(token)
  );
  return data;
};

/**
 * Get production keys (Go Live table)
 */
export const getProductionKeys = async (
  filters?: { page?: number; limit?: number; category?: string; tenant?: string },
  token?: string
): Promise<PaginatedApiKeysResponse> => {
  const { data } = await api.get('/api-key-approvals/production/live', {
    params: filters,
    ...authHeaders(token),
  });
  return data;
};
