import { api } from '../axios';

export interface FieldOption {
  label: string;
  value: string | number | boolean;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'select' | 'multi-select' | 'attachment';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  options?: FieldOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    regex?: string;
  };
  visibility?: {
    roles?: string[];
  };
  ui?: {
    section?: string;
    order?: number;
  };
  // Analytics configuration (child property)
  analytics?: {
    enabled?: boolean; // User toggle for analytics
    type?: string; // Auto-mapped analytics type
    format?: 'currency' | 'percentage'; // For number fields: specify currency or percentage
    excludeFromAnalytics?: boolean; // For textarea fields: exclude from analytics
    includeTime?: boolean; // For date fields: include time (datetime)
    lastAnalyzed?: string; // Last analyzed date
    min?: number; // Analytics-specific min
    max?: number; // Analytics-specific max
    description?: string; // Analytics-specific description
  };
}

export interface UISection {
  id: string;
  title: string;
  description?: string;
  order?: number;
}

export interface TenantConfig {
  tenantId: string;
  entityType: 'user' | 'node';
  fields: CustomField[];
  ui: {
    sections: UISection[];
  };
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantConfigPayload {
  fields: CustomField[];
  ui?: {
    sections: UISection[];
  };
  version?: number;
}

export const tenantConfigApi = {
  // Get user config
  getUserConfig: async (token?: string): Promise<TenantConfig> => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.get<TenantConfig>('/tenant-config/user', options);
    return response.data;
  },

  // Get node config
  getNodeConfig: async (token?: string): Promise<TenantConfig> => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.get<TenantConfig>('/tenant-config/node', options);
    return response.data;
  },

  // Update user config
  updateUserConfig: async (payload: TenantConfigPayload, token?: string): Promise<TenantConfig> => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.put<TenantConfig>('/tenant-config/user', payload, options);
    return response.data;
  },

  // Update node config
  updateNodeConfig: async (payload: TenantConfigPayload, token?: string): Promise<TenantConfig> => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.put<TenantConfig>('/tenant-config/node', payload, options);
    return response.data;
  },

  // Toggle analytics for a specific field
  toggleFieldAnalytics: async (
    entityType: 'user' | 'node',
    fieldId: string,
    enabled: boolean,
    token?: string
  ): Promise<{ success: boolean; data: CustomField; message: string }> => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.patch<{ success: boolean; data: CustomField; message: string }>(
      `/tenant-config/${entityType}/fields/${fieldId}/analytics`,
      { enabled },
      options
    );
    return response.data;
  },

  // Get analytics summary
  getAnalyticsSummary: async (
    entityType: 'user' | 'node',
    token?: string
  ): Promise<{ success: boolean; data: any; message: string }> => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.get<{ success: boolean; data: any; message: string }>(
      `/tenant-config/${entityType}/analytics/summary`,
      options
    );
    return response.data;
  },
};


