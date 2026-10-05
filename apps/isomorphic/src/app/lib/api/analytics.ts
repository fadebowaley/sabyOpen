'use client';

import { api } from '../axios';

export interface AnalyticsFilters {
  tenant_id: string;
  project_id?: string;
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month' | 'year';
}

export interface SubmissionSummaryItem {
  period: string;
  total_submissions: number;
  submitted_count: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  perm_submissions: number;
  avg_compliance: number;
  unique_nodes: number;
  unique_users: number;
  numeric_total_sum: number;
  numeric_total_avg: number;
  boolean_true_total: number;
  boolean_false_total: number;
  total_field_entries: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  percentage: number;
  avg_compliance: number;
  first_submission?: string;
  last_submission?: string;
  numeric_total_sum: number;
  numeric_total_avg: number;
  boolean_true_total: number;
  boolean_false_total: number;
}

export interface MonthBreakdownItem {
  month: number;
  month_name: string;
  total_submissions: number;
  submitted_count: number;
  approved_count: number;
  avg_compliance: number;
  unique_nodes: number;
  numeric_total_sum: number;
  numeric_total_avg: number;
  boolean_true_total: number;
  boolean_false_total: number;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export const getSubmissionSummary = async (
  filters: AnalyticsFilters
): Promise<SubmissionSummaryItem[]> => {
  const { data } = await api.get('/analytics/submissions/summary', {
    params: filters,
  });

  const summary = data?.data?.summary ?? [];

  return summary.map((item: any) => ({
    period: item.period,
    total_submissions: toNumber(item.total_submissions),
    submitted_count: toNumber(item.submitted_count),
    approved_count: toNumber(item.approved_count),
    rejected_count: toNumber(item.rejected_count),
    pending_count: toNumber(item.pending_count),
    perm_submissions: toNumber(item.perm_submissions),
    avg_compliance: toNumber(item.avg_compliance),
    unique_nodes: toNumber(item.unique_nodes),
    unique_users: toNumber(item.unique_users),
    numeric_total_sum: toNumber(item.numeric_total_sum),
    numeric_total_avg: toNumber(item.numeric_total_avg),
    boolean_true_total: toNumber(item.boolean_true_total),
    boolean_false_total: toNumber(item.boolean_false_total),
    total_field_entries: toNumber(item.total_field_entries),
  }));
};

export const getSubmissionsByStatus = async (
  filters: AnalyticsFilters
): Promise<StatusBreakdownItem[]> => {
  const { data } = await api.get('/analytics/submissions/by-status', {
    params: filters,
  });

  const breakdown = data?.data?.breakdown ?? [];

  return breakdown.map((item: any) => ({
    status: item.status,
    count: toNumber(item.count),
    percentage: toNumber(item.percentage),
    avg_compliance: toNumber(item.avg_compliance),
    first_submission: item.first_submission ?? undefined,
    last_submission: item.last_submission ?? undefined,
    numeric_total_sum: toNumber(item.numeric_total_sum),
    numeric_total_avg: toNumber(item.numeric_total_avg),
    boolean_true_total: toNumber(item.boolean_true_total),
    boolean_false_total: toNumber(item.boolean_false_total),
  }));
};

export const getSubmissionsByMonth = async (
  filters: AnalyticsFilters
): Promise<MonthBreakdownItem[]> => {
  const { data } = await api.get('/analytics/submissions/by-month', {
    params: filters,
  });

  const monthly = data?.data?.monthly_breakdown ?? [];

  return monthly.map((item: any) => ({
    month: toNumber(item.month),
    month_name: item.month_name,
    total_submissions: toNumber(item.total_submissions),
    submitted_count: toNumber(item.submitted_count),
    approved_count: toNumber(item.approved_count),
    avg_compliance: toNumber(item.avg_compliance),
    unique_nodes: toNumber(item.unique_nodes),
    numeric_total_sum: toNumber(item.numeric_total_sum),
    numeric_total_avg: toNumber(item.numeric_total_avg),
    boolean_true_total: toNumber(item.boolean_true_total),
    boolean_false_total: toNumber(item.boolean_false_total),
  }));
};


