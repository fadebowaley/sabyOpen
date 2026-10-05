import { api } from '../axios';

export type SubmissionDrilldown = 'daily' | 'weekly' | 'monthly';

export type SubmissionRollupRow = {
  day_bucket?: string;
  week_bucket?: string;
  month_bucket?: string;
  tenant_id?: string;
  project_id?: string;
  node_id?: string | null;
  submissions_count?: number;
  compliance_summary?: {
    avg_percentage?: number;
    min_percentage?: number;
    max_percentage?: number;
    complete_count?: number;
    partial_count?: number;
    incomplete_count?: number;
  } | null;
  field_metrics?: Array<Record<string, unknown>>;
  last_refreshed?: string;
  rollup_source?: string;
};

export type SubmissionRollupResponse = {
  success: boolean;
  results: SubmissionRollupRow[];
  total: number;
};

export type SubmissionModuleTableColumn = {
  key: string;
  label: string;
  pinned?: boolean;
  source_key?: string;
  field_type?: string | null;
  metadata?: Record<string, unknown>;
};

export type SubmissionModuleTableRow = Record<string, unknown>;

export type SubmissionModuleTableResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  display_order: string[];
  summary: {
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
  report_context?: {
    is_open_form?: boolean;
    hide_identity_columns?: boolean;
    authentication_required?: boolean;
    identity_mode?: 'open' | 'secured';
    anonymous_submission_count?: number;
    identified_submission_count?: number;
    mixed_identity_history?: boolean;
  };
  columns: SubmissionModuleTableColumn[];
  rows: SubmissionModuleTableRow[];
};

type BaseFilters = {
  project_id: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
};

export const getSubmissionRollups = async (
  drilldown: SubmissionDrilldown,
  filters: BaseFilters
): Promise<SubmissionRollupResponse> => {
  const { data } = await api.get(`/rollups/${drilldown}`, {
    params: filters,
  });
  return data;
};

export const getProjectFormSubmissionTable = async (
  filters: BaseFilters
): Promise<SubmissionModuleTableResponse> => {
  const { data } = await api.get('/submission-reports/module-table', {
    params: filters,
  });
  return data;
};
