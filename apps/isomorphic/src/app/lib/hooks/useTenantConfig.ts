import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { tenantConfigApi, TenantConfig, TenantConfigPayload, CustomField } from '../api/tenantConfig';

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const useTenantConfig = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const apiRequest = useCallback(
    async (apiFunc: Function, params: any[] = []): Promise<ApiResponse> => {
      setLoading(true);
      try {
        const result = await apiFunc(...params, token);
        return { success: true, data: result };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || 'An error occurred';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const getUserConfig = useCallback(
    async (): Promise<ApiResponse<TenantConfig>> => {
      return apiRequest(tenantConfigApi.getUserConfig, []);
    },
    [apiRequest]
  );

  const getNodeConfig = useCallback(
    async (): Promise<ApiResponse<TenantConfig>> => {
      return apiRequest(tenantConfigApi.getNodeConfig, []);
    },
    [apiRequest]
  );

  const updateUserConfig = useCallback(
    async (payload: TenantConfigPayload): Promise<ApiResponse<TenantConfig>> => {
      const result = await apiRequest(tenantConfigApi.updateUserConfig, [payload]);
      if (result.success) {
        toast.success('User custom fields configuration saved successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const updateNodeConfig = useCallback(
    async (payload: TenantConfigPayload): Promise<ApiResponse<TenantConfig>> => {
      const result = await apiRequest(tenantConfigApi.updateNodeConfig, [payload]);
      if (result.success) {
        toast.success('Node custom fields configuration saved successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const toggleFieldAnalytics = useCallback(
    async (
      entityType: 'user' | 'node',
      fieldId: string,
      enabled: boolean
    ): Promise<ApiResponse<CustomField>> => {
      const result = await apiRequest(tenantConfigApi.toggleFieldAnalytics, [
        entityType,
        fieldId,
        enabled,
      ]);
      if (result.success) {
        toast.success(`Analytics ${enabled ? 'enabled' : 'disabled'} for field`);
      }
      return result;
    },
    [apiRequest]
  );

  const getAnalyticsSummary = useCallback(
    async (entityType: 'user' | 'node'): Promise<ApiResponse<any>> => {
      return apiRequest(tenantConfigApi.getAnalyticsSummary, [entityType]);
    },
    [apiRequest]
  );

  return {
    loading,
    getUserConfig,
    getNodeConfig,
    updateUserConfig,
    updateNodeConfig,
    toggleFieldAnalytics,
    getAnalyticsSummary,
  };
};


