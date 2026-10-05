import { api } from '../axios';

// Types
export interface ComplianceTableItem {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    avatar: string;
  };
  node: {
    id: string;
    nodeId: string;
    name: string;
    levelName: string;
    structureName: string;
  } | null;
  userCompliance: {
    score: number;
    isCompliant: boolean;
    hasProfileData: boolean;
    isManuallyCompliant: boolean;
    profileUpdateCompliant: boolean;
    profileUpdateCompliantAt: string | null;
  };
  nodeCompliance: {
    score: number;
    isCompliant: boolean;
    hasProfileData: boolean;
    isManuallyCompliant: boolean;
    profileUpdateCompliant: boolean;
    profileUpdateCompliantAt: string | null;
  } | null;
  overallCompliance: number;
  isCompliant: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceSummary {
  totalUsers: number;
  totalCompliant: number;
  totalNonCompliant: number;
  totalPartial: number;
  averageCompliance: number;
  complianceRate: number;
}

export interface ComplianceFilters {
  nodeId?: string | null;
  status?: 'compliant' | 'non-compliant' | 'partial' | null;
  search?: string | null;
}

export interface CompliancePagination {
  page?: number;
  limit?: number;
  sortBy?: 'overallCompliance' | 'userCompliance' | 'nodeCompliance' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ComplianceTableResponse {
  data: ComplianceTableItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ComplianceScore {
  userId: string;
  nodeId: string | null;
  userCompliance: {
    score: number;
    isCompliant: boolean;
    details: {
      isCompliant: boolean;
      hasProfileData: boolean;
      isManuallyCompliant: boolean;
      profileUpdateCompliant: boolean;
      profileUpdateCompliantAt: string | null;
      profileUpdateCompliantBy: string | null;
    };
    weight: number;
  };
  nodeCompliance: {
    score: number;
    isCompliant: boolean;
    details: {
      isCompliant: boolean;
      hasProfileData: boolean;
      isManuallyCompliant: boolean;
      profileUpdateCompliant: boolean;
      profileUpdateCompliantAt: string | null;
      profileUpdateCompliantBy: string | null;
    };
    weight: number;
  } | null;
  overallCompliance: number;
  isCompliant: boolean;
}

// API Functions
export const complianceApi = {
  /**
   * Get unified compliance table with pagination and filters
   */
  getComplianceTable: async (
    filters: ComplianceFilters = {},
    pagination: CompliancePagination = {}
  ): Promise<ComplianceTableResponse> => {
    const params = new URLSearchParams();
    
    if (filters.nodeId) params.append('nodeId', filters.nodeId);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.limit) params.append('limit', pagination.limit.toString());
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get(`/compliance/table?${params.toString()}`);
    // Backend returns: { success: true, data: { data: [...], pagination: {...} } }
    const responseData = response.data?.data || response.data;
    return {
      data: responseData?.data || responseData || [],
      pagination: responseData?.pagination || {
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
      },
    };
  },

  /**
   * Get compliance summary statistics
   */
  getComplianceSummary: async (): Promise<ComplianceSummary> => {
    const response = await api.get('/compliance/summary');
    return response.data?.data || response.data || {
      totalUsers: 0,
      totalCompliant: 0,
      totalNonCompliant: 0,
      totalPartial: 0,
      averageCompliance: 0,
      complianceRate: 0,
    };
  },

  /**
   * Update user compliance status
   */
  updateUserCompliance: async (
    userId: string,
    profileUpdateCompliant: boolean
  ): Promise<{
    user: {
      id: string;
      profileUpdateCompliant: boolean;
      profileUpdateCompliantAt: string;
      profileUpdateCompliantBy: string;
    };
    compliance: ComplianceScore;
  }> => {
    const response = await api.patch(`/compliance/user/${userId}`, {
      profileUpdateCompliant,
    });
    return response.data?.data || response.data;
  },

  /**
   * Update node compliance status
   */
  updateNodeCompliance: async (
    nodeId: string,
    profileUpdateCompliant: boolean
  ): Promise<{
    node: {
      id: string;
      nodeId: string;
      profileUpdateCompliant: boolean;
      profileUpdateCompliantAt: string;
      profileUpdateCompliantBy: string;
    };
  }> => {
    const response = await api.patch(`/compliance/node/${nodeId}`, {
      profileUpdateCompliant,
    });
    return response.data?.data || response.data;
  },

  /**
   * Get compliance score for a specific user
   */
  getUserComplianceScore: async (
    userId: string,
    nodeId?: string | null
  ): Promise<ComplianceScore> => {
    const params = new URLSearchParams();
    if (nodeId) params.append('nodeId', nodeId);
    
    const response = await api.get(`/compliance/user/${userId}/score?${params.toString()}`);
    return response.data?.data || response.data;
  },
};

