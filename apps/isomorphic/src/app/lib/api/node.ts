import { api } from '../axios';
import { CreateNodeInput } from '@/validators/create-node.schema';

export interface Node {
  id: string;
  _id?: string;
  nodeId: string;
  name: string;
  deletedAt?: string | null;
  level: {
    id: string;
    _id?: string;
    name: string;
    rank: number;
  };
  structure: {
    id: string;
    _id?: string;
    name: string;
    isSpecial: boolean;
  };
  parent?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfEstablishment?: string;
  isMain: boolean;
  users: {
    id: string;
    _id?: string;
    firstname: string;
    lastname: string;
    email: string;
    avatar: string;
    roles: {
      id: string;
      _id?: string;
      name: string;
    }[];
  }[];
  identity: string[];
  hierarchy: Record<string, string>;
  path: string;
  profileUpdateCompliant?: boolean;
  profileUpdateCompliantAt?: string | null;
  profileUpdateCompliantBy?: string | null;
  profile?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  totalResults: number;
  totalPages: number;
  page: number;
  limit: number;
}

export const nodeApi = {
  // Get all nodes
  getNodes: async (
    token?: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      level?: string;
      includeFamily?: boolean;
      status?: 'active' | 'archived' | 'all';
    }
  ) => {
    const options = {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        level: params?.level,
        includeFamily: params?.includeFamily,
        status: params?.status,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.get<PaginatedResponse<Node>>('/node', options);
    return response.data;
  },

  // Get node by ID
  getNodeById: async (id: string, token?: string) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.get<Node>(`/node/${id}`, options);
    return response.data;
  },

  // Create new node
  createNode: async (data: CreateNodeInput, token?: string) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.post<Node>('/node', data, options);
    return response.data;
  },

  // Update node
  updateNode: async (
    id: string,
    data: Partial<CreateNodeInput>,
    token?: string
  ) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.patch<Node>(`/node/${id}`, data, options);
    return response.data;
  },

  // Delete node
  deleteNode: async (id: string, token?: string) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.delete<Node>(`/node/${id}`, options);
    return response.data;
  },

  deleteNodeHard: async (id: string, token?: string) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.delete<Node>(`/node/${id}/hard`, options);
    return response.data;
  },

  // Get node hierarchy
  getNodeHierarchy: async (id: string, token?: string) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.get<Node>(`/node/${id}/hierarchy`, options);
    return response.data;
  },

  // Assign users to a node
  assignUsersToNode: async (
    nodeId: string,
    userIds: string[],
    token?: string
  ) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };

    const response = await api.patch<Node>(
      `/node/${nodeId}/assign-users`,
      { userIds },
      options
    );
    return response.data;
  },

  restoreNode: async (
    nodeId: string,
    payload: { parent?: string | null; level?: string },
    token?: string
  ) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.patch<Node>(
      `/node/${nodeId}/restore`,
      payload,
      options
    );
    return response.data;
  },

  // Bulk import nodes
  bulkImportNodes: async (nodes: CreateNodeInput[], token?: string) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.post<{ message: string; data: Node[] }>(
      '/node/bulk-import',
      { nodes },
      options
    );
    return response.data;
  },

  getNodeBranch: async (nodeId: string, token?: string) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.get<{ results: Node[] }>(
      `/node/${nodeId}/branch`,
      options
    );
    return response.data;
  },

  getNodeBranches: async (nodeIds: string[], token?: string) => {
    const options = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const response = await api.post<{ results: Node[] }>(
      '/node/branches',
      { nodeIds },
      options
    );
    return response.data;
  },
};
