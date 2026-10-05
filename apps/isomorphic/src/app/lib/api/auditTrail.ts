import { api } from '../axios';

export interface AuditTrailFilters {
  tenantId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  method?: string;
  statusCode?: number;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export interface AuditTrailEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource: string;
  resource_id: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string;
  user_agent: string;
  request_body: any;
  duration_ms: number;
  error_message: string;
  correlation_id: string;
  source: string;
  created_at: string;
}

export interface AuditTrailResponse {
  results: AuditTrailEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getAuditTrail = async (
  filters?: AuditTrailFilters,
  token?: string
): Promise<AuditTrailResponse> => {
  const params: Record<string, any> = {};

  if (filters?.tenantId) params.tenantId = filters.tenantId;
  if (filters?.userId) params.userId = filters.userId;
  if (filters?.action) params.action = filters.action;
  if (filters?.resource) params.resource = filters.resource;
  if (filters?.resourceId) params.resourceId = filters.resourceId;
  if (filters?.method) params.method = filters.method;
  if (filters?.statusCode) params.statusCode = filters.statusCode;
  if (filters?.from) params.from = filters.from;
  if (filters?.to) params.to = filters.to;
  if (filters?.search) params.search = filters.search;
  if (filters?.sortBy) params.sortBy = filters.sortBy;
  if (filters?.order) params.order = filters.order;
  if (filters?.page) params.page = filters.page;
  if (filters?.limit) params.limit = filters.limit;

  const options = {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  const { data } = await api.get('/audit-trail', options);
  return data;
};

export const exportAuditTrail = async (
  filters?: AuditTrailFilters,
  format: 'csv' | 'json' = 'csv',
  token?: string
): Promise<Blob> => {
  const params: Record<string, any> = { format };
  if (filters?.from) params.from = filters.from;
  if (filters?.to) params.to = filters.to;
  if (filters?.resource) params.resource = filters.resource;
  if (filters?.action) params.action = filters.action;

  const response = await api.get('/audit-trail/export', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    responseType: 'blob',
  });
  return response.data;
};
