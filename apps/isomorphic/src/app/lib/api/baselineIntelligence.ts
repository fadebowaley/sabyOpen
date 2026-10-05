import { api } from '../axios';

// Types
export interface BaselineMetrics {
  totalUsers: number;
  totalNodes?: number;
  genderDistribution: { male: number; female: number; other: number };
  ageDistribution: { [key: string]: number };
  workforceComposition: { [key: string]: number };
  leadershipToMemberRatio: number;
  activeInactiveAccounts: { active: number; inactive: number };
  averageAge: number;
  skillsGrouping: { [key: string]: number };
  tenureGrouping: { [key: string]: number };
  propertyOwnership: { owned: number; rented: number; other: number };
  branchAge: number;
  nodeCategories: { [key: string]: number };
  capacityMetrics: {
    totalCapacity: number;
    currentOccupancy: number;
    utilizationRate: number;
  };
  regionStateDistribution: { [key: string]: number };
  nodeTypeGroupings: { [key: string]: number };
  officeTitles?: Array<{ title: string; count: number }>;
  professional?: Array<{ category: string; occupation: string; count: number }>;
  roles?: Array<{ roleId: string; roleName: string; count: number }>;
  // Hierarchy removed - we only focus on Role model roles, not system roles
  // hierarchy?: { owners: number; supers: number; ordinary: number; sabyUsers: number };
  demographics?: {
    maritalStatus?: { single: number; married: number; divorced: number; widowed: number; unknown: number };
    gender?: { male: number; female: number; other: number; unknown: number };
    ageGroups?: { [key: string]: number };
    averageAge?: number;
  };
  qualifications?: Array<{ qualification: string; count: number }>;
  attendance?: {
    total: number;
    average: number;
    top10: Array<{
      rank: number;
      nodeId: string;
      name: string;
      levelName: string;
      structureName: string;
      parentName?: string; // Parent node name
      attendance: number;
    }>;
  };
  income?: {
    total: number;
    average: number;
    top10: Array<{
      rank: number;
      nodeId: string;
      name: string;
      levelName: string;
      structureName: string;
      parentName?: string; // Parent node name
      income: number;
    }>;
  };
  customAnalytics?: {
    users: {
      numeric: Array<{
        fieldName: string;
        displayName: string;
        fieldType: string;
        statistics: {
          count: number;
          average: number;
          median: number;
          min: number;
          max: number;
          stdDev: number;
        };
        distribution: Array<{
          range: string;
          count: number;
          percentage: number;
        }>;
      }>;
      categorical: Array<{
        fieldName: string;
        displayName: string;
        fieldType: string;
        distribution: { [key: string]: number };
        topValues: Array<{ value: string; count: number; percentage: number }>;
        uniqueCount: number;
      }>;
    };
    nodes: {
      numeric: Array<{
        fieldName: string;
        displayName: string;
        fieldType: string;
        statistics: {
          count: number;
          average: number;
          median: number;
          min: number;
          max: number;
          stdDev: number;
        };
        distribution: Array<{
          range: string;
          count: number;
          percentage: number;
        }>;
      }>;
      categorical: Array<{
        fieldName: string;
        displayName: string;
        fieldType: string;
        distribution: { [key: string]: number };
        topValues: Array<{ value: string; count: number; percentage: number }>;
        uniqueCount: number;
      }>;
    };
  };
  fieldGroups?: Array<{
    id: string;
    name: string;
    analysisType: 'aggregate' | 'compare' | 'trend';
    displayOrder: number;
    fields: Array<{
      fieldId: string;
      value: any;
      displayName?: string;
    }>;
    aggregate?: {
      sum: number;
      average: number;
      min: number;
      max: number;
      count: number;
    };
    comparison?: {
      fields: Array<{
        fieldId: string;
        value: any;
        displayName?: string;
      }>;
    };
    trend?: {
      fields: Array<{
        fieldId: string;
        value: any;
        displayName?: string;
      }>;
    };
  }> | null;
}

export interface BaselineInsight {
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  recommendations: string[];
  type: 'demographic' | 'facility' | 'network' | 'custom';
  field?: string;
}

export interface BaselineIntelligence {
  _id: string;
  tenantId: string;
  nodeId?: string;
  type: 'node' | 'network';
  metrics: BaselineMetrics;
  insights: BaselineInsight[];
  updatedAt: string;
  createdAt: string;
}

export interface BaselineSummary {
  totalNodes: number;
  totalUsers: number;
  lastUpdated: string;
  healthScore: number;
  criticalInsights: number;
  networkMetrics: {
    totalBranches: number;
    totalWorkforce: number;
    regionalDistribution: { [key: string]: number };
    avgUtilizationRate: number;
  };
}

export interface BaselineHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  lastRecompute: string;
  pendingRecomputes: number;
  cacheHitRate: number;
  avgComputeTime: number;
}

/**
 * Transform backend metrics structure to frontend format
 */
function transformBaselineMetrics(backendMetrics: any): BaselineMetrics {
  if (!backendMetrics) {
    return {
      totalUsers: 0,
      genderDistribution: { male: 0, female: 0, other: 0 },
      ageDistribution: {},
      workforceComposition: {},
      leadershipToMemberRatio: 0,
      activeInactiveAccounts: { active: 0, inactive: 0 },
      averageAge: 0,
      skillsGrouping: {},
      tenureGrouping: {},
      propertyOwnership: { owned: 0, rented: 0, other: 0 },
      branchAge: 0,
      nodeCategories: {},
      capacityMetrics: { totalCapacity: 0, currentOccupancy: 0, utilizationRate: 0 },
      regionStateDistribution: {},
      nodeTypeGroupings: {},
    };
  }

  // Extract user metrics
  const users = backendMetrics.users || {};
  const demographics = users.demographics || {};
  const gender = demographics.gender || {};
  const ageGroups = demographics.ageGroups || {};
  
  // Transform age groups to age distribution
  const ageDistribution: { [key: string]: number } = {};
  if (ageGroups.under18) ageDistribution['0-18'] = ageGroups.under18;
  if (ageGroups['19to30']) ageDistribution['19-30'] = ageGroups['19to30'];
  if (ageGroups['31to45']) ageDistribution['31-45'] = ageGroups['31to45'];
  if (ageGroups['46to60']) ageDistribution['46-60'] = ageGroups['46to60'];
  if (ageGroups.over60) ageDistribution['60+'] = ageGroups.over60;

  // Transform professional data to workforce composition
  const workforceComposition: { [key: string]: number } = {};
  if (users.professional && Array.isArray(users.professional)) {
    users.professional.forEach((prof: any) => {
      const key = prof.occupation || prof.category || 'Unknown';
      workforceComposition[key] = (workforceComposition[key] || 0) + (prof.count || 0);
    });
  }

  // Extract facility metrics
  const facility = backendMetrics.facility || {};
  const branchAge = facility.establishmentAge || 0;
  
  // Extract network metrics
  const network = backendMetrics.network || {};
  
  // State distribution - from network.stateDistribution array
  const regionStateDistribution: { [key: string]: number } = {};
  if (network.stateDistribution && Array.isArray(network.stateDistribution)) {
    network.stateDistribution.forEach((item: any) => {
      const state = item.state || 'Unknown';
      regionStateDistribution[state] = item.count || 0;
    });
  } else if (network.regionalDistribution && Array.isArray(network.regionalDistribution)) {
    // Fallback to old format for backward compatibility
    network.regionalDistribution.forEach((region: any) => {
      const key = region.region || 'Unknown';
      regionStateDistribution[key] = (regionStateDistribution[key] || 0) + (region.nodes || 0);
    });
  }

  // Node Family Distribution - from network.structureDistribution array (counts by structure name)
  const nodeTypeGroupings: { [key: string]: number } = {};
  if (network.structureDistribution && Array.isArray(network.structureDistribution)) {
    network.structureDistribution.forEach((item: any) => {
      const structureName = item.structureName || 'Unknown';
      nodeTypeGroupings[structureName] = item.count || 0;
    });
  } else if (network.nodesByType && Array.isArray(network.nodesByType)) {
    // Fallback to old format for backward compatibility
    network.nodesByType.forEach((type: any) => {
      const key = type.type || 'Unknown';
      nodeTypeGroupings[key] = (nodeTypeGroupings[key] || 0) + (type.count || 0);
    });
  }

  // Leadership ratio removed - we only focus on Role model roles, not system roles
  // If leadership ratio is needed in the future, it should be calculated based on role mapping configuration
  const leadershipToMemberRatio = 0;

  return {
    totalUsers: users.total || 0,
    totalNodes: network.totalNodes || 0,
    genderDistribution: {
      male: gender.male || 0,
      female: gender.female || 0,
      other: gender.other || 0,
    },
    ageDistribution,
    workforceComposition,
    leadershipToMemberRatio,
    activeInactiveAccounts: {
      active: users.active || 0,
      inactive: users.inactive || 0,
    },
    averageAge: demographics.averageAge || 0,
    skillsGrouping: {}, // TODO: Map from backend if available
    tenureGrouping: {}, // TODO: Map from backend if available
    propertyOwnership: {
      owned: network.nodesByProperty?.owned || 0,
      rented: network.nodesByProperty?.rented || 0,
      other: network.nodesByProperty?.other || 0,
    },
    branchAge,
    nodeCategories: {}, // TODO: Map from backend if available
    capacityMetrics: {
      totalCapacity: 0, // TODO: Map from backend if available
      currentOccupancy: 0, // TODO: Map from backend if available
      utilizationRate: 0, // TODO: Map from backend if available
    },
    regionStateDistribution,
    nodeTypeGroupings,
    officeTitles: users.officeTitles || [],
    professional: users.professional || [],
    roles: users.roles || [],
    // Hierarchy removed - we only focus on Role model roles
    // hierarchy: users.hierarchy || { owners: 0, supers: 0, ordinary: 0, sabyUsers: 0 },
    demographics: {
      maritalStatus: demographics.maritalStatus || { single: 0, married: 0, divorced: 0, widowed: 0, unknown: 0 },
      gender: gender,
      ageGroups: ageGroups,
      averageAge: demographics.averageAge || 0,
    },
    qualifications: (users as any).qualifications || [],
    attendance: network.attendance || { total: 0, average: 0, top10: [] },
    income: network.income || { total: 0, average: 0, top10: [] },
    customAnalytics: backendMetrics.customAnalytics,
    fieldGroups: backendMetrics.fieldGroups || null,
  };
}

// API Functions
export const baselineIntelligenceApi = {
  // Get node baseline
  getNodeBaseline: async (nodeId: string): Promise<BaselineIntelligence> => {
    try {
      const response = await api.get(`/baseline/node/${nodeId}`);
      // Backend returns { success: true, data: ... }
      const baseline = response.data?.data || response.data;
      if (baseline && baseline.metrics) {
        baseline.metrics = transformBaselineMetrics(baseline.metrics);
      } else if (baseline && !baseline.metrics) {
        // Ensure metrics always exists
        baseline.metrics = transformBaselineMetrics(null);
      }
      return baseline;
    } catch (error) {
      console.error('Error fetching node baseline:', error);
      // Return a safe default structure
      return {
        _id: '',
        tenantId: '',
        nodeId: nodeId,
        type: 'node',
        metrics: transformBaselineMetrics(null),
        insights: [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }
  },

  // Get network baseline
  getNetworkBaseline: async (): Promise<BaselineIntelligence> => {
    try {
      const response = await api.get('/baseline/network');
      // Backend returns { success: true, data: ... }
      const baseline = response.data?.data || response.data;
      if (baseline && baseline.metrics) {
        baseline.metrics = transformBaselineMetrics(baseline.metrics);
      } else if (baseline && !baseline.metrics) {
        // Ensure metrics always exists
        baseline.metrics = transformBaselineMetrics(null);
      }
      return baseline;
    } catch (error) {
      console.error('Error fetching network baseline:', error);
      // Return a safe default structure
      return {
        _id: '',
        tenantId: '',
        type: 'network',
        metrics: transformBaselineMetrics(null),
        insights: [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }
  },

  // Get node insights
  getNodeInsights: async (nodeId: string): Promise<BaselineInsight[]> => {
    const response = await api.get(`/baseline/node/${nodeId}/insights`);
    // Backend returns { success: true, data: ... }
    return response.data?.data || response.data || [];
  },

  // Get network insights
  getNetworkInsights: async (): Promise<BaselineInsight[]> => {
    const response = await api.get('/baseline/network/insights');
    // Backend returns { success: true, data: ... }
    return response.data?.data || response.data || [];
  },

  // Recompute node baseline
  recomputeNodeBaseline: async (nodeId: string): Promise<{ message: string }> => {
    const response = await api.post(`/baseline/node/${nodeId}/recompute`);
    // Backend returns { success: true, data: ... }
    return response.data?.data || response.data;
  },

  // Get baseline summary
  getBaselineSummary: async (): Promise<BaselineSummary> => {
    const response = await api.get('/baseline/summary');
    // Backend returns { success: true, data: ... }
    return response.data?.data || response.data;
  },

  // Get health status
  getHealthStatus: async (): Promise<BaselineHealthStatus> => {
    const response = await api.get('/baseline/health');
    // Backend returns { success: true, data: ... }
    return response.data?.data || response.data;
  },

  // Get top nodes by attendance or income
  getTopNodes: async (type: 'attendance' | 'income', limit: number = 10): Promise<Array<{
    rank: number;
    nodeId: string;
    name: string;
    levelName: string;
    structureName: string;
    attendance?: number;
    income?: number;
  }>> => {
    const response = await api.get(`/baseline/network/top-nodes?type=${type}&limit=${limit}`);
    return response.data?.data || response.data || [];
  },

  // Get geographic distribution
  getGeographicDistribution: async (): Promise<{
    states: Array<{ state: string; count: number; percentage: number }>;
    countries: Array<{ country: string; count: number; percentage: number }>;
    top5States: Array<{ state: string; count: number; percentage: number }>;
    top5Countries: Array<{ country: string; count: number; percentage: number }>;
  }> => {
    const response = await api.get('/baseline/network/geographic-distribution');
    return response.data?.data || response.data || {
      states: [],
      countries: [],
      top5States: [],
      top5Countries: [],
    };
  },

  // Get health score
  getHealthScore: async (): Promise<{
    overallScore: number;
    indicators: {
      profileCompletion: number;
      dataQuality: number;
      growthRate: number;
      financialHealth: number;
      engagementRate: number;
      infrastructureHealth: number;
    };
    insights: Array<{
      priority: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      recommendations: string[];
    }>;
    trend: 'up' | 'down' | 'stable';
    trendValue: string;
  }> => {
    const response = await api.get('/baseline/network/health-score');
    return response.data?.data || response.data || {
      overallScore: 0,
      indicators: {
        profileCompletion: 0,
        dataQuality: 0,
        growthRate: 0,
        financialHealth: 0,
        engagementRate: 0,
        infrastructureHealth: 0,
      },
      insights: [],
      trend: 'stable',
      trendValue: '0%',
    };
  },
};

// Custom Field Analytics API
export interface CustomFieldConfig {
  tenantId: string;
  entityType: 'user' | 'node';
  fields: Array<{
    fieldName: string;
    displayName: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi-select' | 'currency' | 'percentage';
    analyticsEnabled: boolean;
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
  }>;
  version: number;
}

export const customFieldAnalyticsApi = {
  // Get custom field config
  getCustomFieldConfig: async (entityType: 'user' | 'node'): Promise<CustomFieldConfig> => {
    const response = await api.get(`/custom-field-config/${entityType}`);
    return response.data;
  },

  // Update custom field config
  updateCustomFieldConfig: async (
    entityType: 'user' | 'node',
    fields: CustomFieldConfig['fields']
  ): Promise<CustomFieldConfig> => {
    const response = await api.put(`/custom-field-config/${entityType}`, { fields });
    return response.data;
  },
};
