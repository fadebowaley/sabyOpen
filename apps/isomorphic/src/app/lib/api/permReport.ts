import { api } from '../axios';

export interface PermReportFilters {
  tenant_id?: string;
  project_id: string;
  node_id?: string;
  structure_name?: string;
  level_name?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  month?: string;
  limit?: number;
  offset?: number;
}

export interface PermReportRow {
  submission_id: string;
  tenant_id: string;
  project_id: string;
  form_id: string;
  node_id: string | null;
  node_name: string | null;
  node_reference: string | null;
  node_code: string | null;
  structure_name: string | null;
  level_name: string | null;
  event_compliance_percentage: number | null;
  boolean_true_count: number | null;
  boolean_false_count: number | null;
  numeric_total: number | null;
  created_at: string | null;
  structured_fields: Array<{
    key: string;
    label: string;
    type: string | null;
    value_text?: string | null;
    value_numeric?: number | null;
    value_boolean?: boolean | null;
    value_date?: string | null;
  }>;
  structured_map: Record<string, any>;
}

export interface PermReportResponse {
  success: boolean;
  total: number;
  summary: Record<string, number>;
  results: PermReportRow[];
}

export interface ModuleReportColumn {
  key: string;
  label: string;
  pinned?: boolean;
  source_key?: string;
}

export interface ModuleReportTableResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  display_order?: string[];
  summary?: {
    total_rows: number;
    unique_nodes: number;
    first_submission_at: string | null;
    latest_submission_at: string | null;
    submitted_count: number;
    approved_count: number;
    pending_count: number;
    rejected_count: number;
    completed_count: number;
    failed_count: number;
  };
  columns: ModuleReportColumn[];
  rows: Record<string, any>[];
}

export const getPermReport = async (
  filters: PermReportFilters
): Promise<PermReportResponse> => {
  const { data } = await api.get('/perm-report', { params: filters });
  return data;
};

export const getModuleReportTable = async (filters: {
  project_id: string;
  node_id?: string;
  month?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<ModuleReportTableResponse> => {
  const { data } = await api.get('/submission-reports/module-table', {
    params: filters,
  });
  return data;
};


