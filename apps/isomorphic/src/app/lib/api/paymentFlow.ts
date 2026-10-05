import { api } from '../axios';

export interface PaymentFlowFilters {
  tenantId?: string;
  userId?: string;
  provider?: string;
  paymentStatus?: string;
  fundingStatus?: string;
  reconciliationStatus?: string;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export interface PaymentFlowEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  payment_id: string;
  payment_reference: string;
  provider: string;
  amount: number;
  currency: string;
  purpose: string;
  beneficiary: string;
  payment_status: string;
  payment_created_at: string;
  payment_processed_at: string;
  payment_completed_at: string;
  payment_failed_at: string;
  failure_reason: string;
  settlement_id: string;
  settlement_status: string;
  funding_status: string;
  availability_status: string;
  provider_settlement_id: string;
  provider_settled_at: string;
  settlement_fee: number;
  service_fee: number;
  provider_fee: number;
  provider_app_fee: number;
  provider_merchant_fee: number;
  net_amount: number;
  destination_type: string;
  destination_node: string;
  destination_account_number: string;
  destination_account_name: string;
  destination_bank_name: string;
  destination_bank_code: string;
  reconciliation_status: string;
  last_reconciled_at: string;
  remittance_queued: boolean;
  updated_at: string;
}

export interface PaymentFlowResponse {
  results: PaymentFlowEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getPaymentFlow = async (
  filters?: PaymentFlowFilters,
  token?: string
): Promise<PaymentFlowResponse> => {
  const params: Record<string, any> = {};
  if (filters?.provider) params.provider = filters.provider;
  if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
  if (filters?.fundingStatus) params.fundingStatus = filters.fundingStatus;
  if (filters?.reconciliationStatus) params.reconciliationStatus = filters.reconciliationStatus;
  if (filters?.from) params.from = filters.from;
  if (filters?.to) params.to = filters.to;
  if (filters?.search) params.search = filters.search;
  if (filters?.sortBy) params.sortBy = filters.sortBy;
  if (filters?.order) params.order = filters.order;
  if (filters?.page) params.page = filters.page;
  if (filters?.limit) params.limit = filters.limit;

  const { data } = await api.get('/payment-flow', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
};

export const exportPaymentFlow = async (
  filters?: PaymentFlowFilters,
  format: 'csv' | 'json' = 'csv',
  token?: string
): Promise<Blob> => {
  const params: Record<string, any> = { format };
  if (filters?.provider) params.provider = filters.provider;
  if (filters?.from) params.from = filters.from;
  if (filters?.to) params.to = filters.to;

  const response = await api.get('/payment-flow/export', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    responseType: 'blob',
  });
  return response.data;
};
