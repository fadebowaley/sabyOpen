import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import * as api from '@/app/lib/api/projectForms';

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

type ProjectFormsResponse = {
  success: boolean;
  data?: {
    results: api.ProjectForm[];
    totalResults: number;
    limit: number;
    page: number;
    totalPages: number;
  };
  message?: string;
};

export const useProjectForms = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const apiRequest = useCallback(
    async <T = any>(
      apiFunc: (...args: any[]) => Promise<T>,
      params: any[] = []
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...params, token);
        return { success: true, data: result };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'An error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const createProjectForm = useCallback(
    async (payload: api.ProjectFormData): Promise<ApiResponse> => {
      const response = await apiRequest(api.createProjectForm, [payload]);
      if (response.success) toast.success('Project created successfully!');
      return response;
    },
    [apiRequest]
  );

  const getProjectForms = useCallback(
    async (
      filters?: api.ProjectFormFilters & { limit?: number; page?: number }
    ): Promise<ProjectFormsResponse> => {
      const response = await apiRequest(api.getProjectForms, [filters]);
      return {
        success: response.success,
        data: response.data as ProjectFormsResponse['data'],
        message: response.error,
      };
    },
    [apiRequest]
  );

  const getProjectForm = useCallback(
    async (projectFormId: string): Promise<ApiResponse> =>
      apiRequest(api.getProjectForm, [projectFormId]),
    [apiRequest]
  );

  const getProjectFormByProjectId = useCallback(
    async (projectId: string): Promise<ApiResponse> =>
      apiRequest(api.getProjectFormByProjectId, [projectId]),
    [apiRequest]
  );

  const getProjectFormsByTenant = useCallback(
    async (
      tenantId: string,
      filters?: Omit<api.ProjectFormFilters, 'tenantId'>
    ): Promise<ApiResponse> =>
      apiRequest(api.getProjectFormsByTenant, [tenantId, filters]),
    [apiRequest]
  );

  const getProjectFormsByUser = useCallback(
    async (
      userId: string,
      filters?: Omit<api.ProjectFormFilters, 'tenantId'>
    ): Promise<ApiResponse> =>
      apiRequest(api.getProjectFormsByUser, [userId, filters]),
    [apiRequest]
  );

  const updateProjectForm = useCallback(
    async (
      projectFormId: string,
      payload: Partial<api.ProjectFormData>
    ): Promise<ApiResponse> => {
      const response = await apiRequest(api.updateProjectForm, [
        projectFormId,
        payload,
      ]);
      if (response.success) toast.success('Project updated successfully!');
      return response;
    },
    [apiRequest]
  );

  const updateProjectFormByProjectId = useCallback(
    async (
      projectId: string,
      payload: Partial<api.ProjectFormData>
    ): Promise<ApiResponse> => {
      const response = await apiRequest(api.updateProjectFormByProjectId, [
        projectId,
        payload,
      ]);
      if (response.success) toast.success('Project updated successfully!');
      return response;
    },
    [apiRequest]
  );

  const deleteProjectForm = useCallback(
    async (projectFormId: string): Promise<ApiResponse> => {
      const response = await apiRequest(api.deleteProjectForm, [projectFormId]);
      if (response.success) toast.success('Project deleted successfully!');
      return response;
    },
    [apiRequest]
  );

  const softDeleteProjectForm = useCallback(
    async (projectFormId: string): Promise<ApiResponse> => {
      const response = await apiRequest(api.softDeleteProjectForm, [projectFormId]);
      if (response.success) toast.success('Project moved to trash!');
      return response;
    },
    [apiRequest]
  );

  const restoreProjectForm = useCallback(
    async (projectFormId: string): Promise<ApiResponse> => {
      const response = await apiRequest(api.restoreProjectForm, [projectFormId]);
      if (response.success) toast.success('Project restored successfully!');
      return response;
    },
    [apiRequest]
  );

  const publishProjectForm = useCallback(
    async (projectFormId: string): Promise<ApiResponse> => {
      const response = await apiRequest(api.publishProjectForm, [projectFormId]);
      if (response.success) toast.success('Project published successfully!');
      return response;
    },
    [apiRequest]
  );

  const archiveProjectForm = useCallback(
    async (projectFormId: string): Promise<ApiResponse> => {
      const response = await apiRequest(api.archiveProjectForm, [projectFormId]);
      if (response.success) toast.success('Project archived successfully!');
      return response;
    },
    [apiRequest]
  );

  const getProjectAnalytics = useCallback(
    async (projectId: string): Promise<ApiResponse> =>
      apiRequest(api.getProjectAnalytics, [projectId]),
    [apiRequest]
  );

  const incrementProjectSubmissions = useCallback(
    async (projectId: string): Promise<ApiResponse> =>
      apiRequest(api.incrementProjectSubmissions, [projectId]),
    [apiRequest]
  );

  const bulkOperations = useCallback(
    async (operations: api.BulkOperation[]): Promise<ApiResponse> => {
      const response = await apiRequest(api.bulkOperations, [operations]);
      if (response.success) toast.success('Bulk operations completed successfully!');
      return response;
    },
    [apiRequest]
  );

  const searchProjectForms = useCallback(
    async (
      query: string,
      filters?: Omit<api.ProjectFormFilters, 'q'>
    ): Promise<ApiResponse> => apiRequest(api.searchProjectForms, [query, filters]),
    [apiRequest]
  );

  const getProjectFormStats = useCallback(
    async (): Promise<ApiResponse> => apiRequest(api.getProjectFormStats, []),
    [apiRequest]
  );

  return {
    loading,
    error,
    createProjectForm,
    getProjectForms,
    getProjectForm,
    getProjectFormByProjectId,
    getProjectFormsByTenant,
    getProjectFormsByUser,
    updateProjectForm,
    updateProjectFormByProjectId,
    deleteProjectForm,
    softDeleteProjectForm,
    restoreProjectForm,
    publishProjectForm,
    archiveProjectForm,
    getProjectAnalytics,
    incrementProjectSubmissions,
    bulkOperations,
    searchProjectForms,
    getProjectFormStats,
  };
};
