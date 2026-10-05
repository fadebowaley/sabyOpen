import { api } from '../axios';

// Types
export type EntityType = 'user' | 'node';

export interface EssentialMetricsConfig {
  demographics?: {
    enabled?: boolean;
    analysis?: {
      gender?: { enabled?: boolean };
      age?: {
        enabled?: boolean;
        ageGroups?: {
          enabled?: boolean;
          customGroups?: Array<{ name: string; min: number; max: number }>;
        };
      };
      maritalStatus?: { enabled?: boolean };
    };
  };
  hierarchy?: {
    enabled?: boolean;
    analysis?: {
      roleMapping?: {
        owners?: string[];
        supers?: string[];
        ordinary?: string[];
      };
      terminology?: {
        owners?: string;
        supers?: string;
        ordinary?: string;
      };
    };
  };
  geography?: {
    enabled?: boolean;
    analysis?: {
      levels?: string[];
      customRegions?: Array<{
        name: string;
        states?: string[];
        lgas?: string[];
      }>;
    };
  };
  professional?: {
    enabled?: boolean;
    analysis?: {
      occupation?: { enabled?: boolean };
      employmentCategory?: { enabled?: boolean };
      education?: { enabled?: boolean };
    };
  };
  verification?: {
    enabled?: boolean;
    analysis?: {
      email?: { enabled?: boolean };
      phone?: { enabled?: boolean };
    };
  };
  facility?: {
    enabled?: boolean;
    analysis?: {
      propertyStatus?: { enabled?: boolean };
      buildingType?: { enabled?: boolean };
      facilityStatus?: { enabled?: boolean };
    };
  };
}

export interface CustomFieldAnalysisConfig {
  enabled?: boolean;
  type?: 'numeric' | 'categorical' | 'temporal' | 'boolean';
  numeric?: {
    format?: 'number' | 'currency' | 'percentage';
    statistics?: {
      enabled?: boolean;
      include?: {
        total?: boolean;
        average?: boolean;
        median?: boolean;
        min?: boolean;
        max?: boolean;
        standardDeviation?: boolean;
      };
    };
    distribution?: {
      enabled?: boolean;
      ranges?: 'auto' | 'custom';
      customRanges?: Array<{ name: string; min: number; max: number }>;
    };
    thresholds?: {
      min?: number;
      max?: number;
      warning?: { min?: number; max?: number };
      critical?: { min?: number; max?: number };
    };
  };
  categorical?: {
    distribution?: {
      enabled?: boolean;
      topN?: number;
    };
    diversity?: {
      enabled?: boolean;
      maxUniqueValues?: number;
    };
  };
  temporal?: {
    includeTime?: boolean;
    analysis?: {
      earliest?: boolean;
      latest?: boolean;
      averageAge?: boolean;
      trends?: boolean;
    };
  };
  boolean?: {
    analysis?: {
      trueCount?: boolean;
      falseCount?: boolean;
      percentage?: boolean;
    };
  };
  insights?: {
    enabled?: boolean;
    rules?: Array<{
      condition: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      recommendations?: string[];
    }>;
  };
  display?: {
    label?: string;
    description?: string;
    unit?: string;
    order?: number;
    category?: string;
    chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'gauge' | 'table';
  };
}

export interface GlobalSettingsConfig {
  thresholds?: {
    leadershipRatio?: {
      optimal?: { min: number; max: number };
      warning?: { min: number; max: number };
    };
    complianceRate?: {
      target?: number;
      warning?: number;
    };
    capacityUtilization?: {
      optimal?: { min: number; max: number };
      warning?: { min: number; max: number };
    };
  };
  customCalculations?: Array<{
    id: string;
    name: string;
    formula: string;
    displayName: string;
    unit?: string;
    description?: string;
    dependencies?: string[];
  }>;
  fieldGroups?: Array<{
    id: string;
    name: string;
    fields: string[];
    displayOrder?: number;
    analysisType?: 'aggregate' | 'compare' | 'trend';
  }>;
  insightRules?: Array<{
    id: string;
    metric: string;
    condition: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recommendations?: string[];
    enabled?: boolean;
  }>;
}

export interface BaselineAnalysisConfig {
  tenantId: string;
  entityType: EntityType;
  essentialMetrics?: EssentialMetricsConfig;
  customFields?: Array<{
    fieldId: string;
    analysis: CustomFieldAnalysisConfig;
  }>;
  globalSettings?: GlobalSettingsConfig;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions
export const baselineAnalysisConfigApi = {
  /**
   * Get analysis configuration for a tenant and entity type
   */
  getAnalysisConfig: async (entityType: EntityType): Promise<BaselineAnalysisConfig> => {
    const response = await api.get(`/baseline-analysis-config/${entityType}`);
    return response.data?.data || response.data;
  },

  /**
   * Update essential metrics configuration
   */
  updateEssentialMetrics: async (
    entityType: EntityType,
    essentialMetrics: EssentialMetricsConfig
  ): Promise<BaselineAnalysisConfig> => {
    const response = await api.put(`/baseline-analysis-config/${entityType}/essential-metrics`, {
      essentialMetrics,
    });
    return response.data?.data || response.data;
  },

  /**
   * Update custom field analysis configuration
   */
  updateCustomFieldAnalysis: async (
    entityType: EntityType,
    fieldId: string,
    analysis: CustomFieldAnalysisConfig
  ): Promise<BaselineAnalysisConfig> => {
    const response = await api.put(
      `/baseline-analysis-config/${entityType}/custom-fields/${fieldId}`,
      { analysis }
    );
    return response.data?.data || response.data;
  },

  /**
   * Update global settings
   */
  updateGlobalSettings: async (
    entityType: EntityType,
    globalSettings: GlobalSettingsConfig
  ): Promise<BaselineAnalysisConfig> => {
    const response = await api.put(`/baseline-analysis-config/${entityType}/global-settings`, {
      globalSettings,
    });
    return response.data?.data || response.data;
  },

  /**
   * Sync analysis config with tenant config
   */
  syncWithTenantConfig: async (entityType: EntityType): Promise<BaselineAnalysisConfig> => {
    const response = await api.post(`/baseline-analysis-config/${entityType}/sync`);
    return response.data?.data || response.data;
  },
};

