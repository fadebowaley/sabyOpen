'use client';

import { useState, useCallback } from 'react';
import * as api from '@/app/lib/api/roles';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export const useRole = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  //Utility functions for Api Requests
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

  const createRole = useCallback(
    async (payload: any): Promise<ApiResponse> => {
      return apiRequest(api.createRole, [payload]);
    },
    [apiRequest]
  );

  const getRoles = useCallback(async (): Promise<ApiResponse> => {
    return apiRequest(api.getRoles);
  }, [apiRequest]);

  const getRoleById = useCallback(
    async (roleId: string): Promise<ApiResponse> => {
      return apiRequest(api.getRoleById, [roleId]);
    },
    [apiRequest]
  );

  const updateRole = useCallback(
    async (roleId: string, payload: any): Promise<ApiResponse> => {
      return apiRequest(api.updateRole, [roleId, payload]);
    },
    [apiRequest]
  );

  const deleteRole = useCallback(
    async (roleId: string): Promise<ApiResponse> => {
      return apiRequest(api.deleteRole, [roleId]);
    },
    [apiRequest]
  );

  const deleteAllRoles = useCallback(async (): Promise<ApiResponse> => {
    return apiRequest(api.deleteAllRoles);
  }, [apiRequest]);

  const bulkCreateRoles = useCallback(
    async (payload: any[]): Promise<ApiResponse> => {
      return apiRequest(api.bulkCreateRoles, [payload]);
    },
    [apiRequest]
  );

  const getRoleTemplates = useCallback(async (): Promise<ApiResponse> => {
    return apiRequest(api.getRoleTemplates);
  }, [apiRequest]);

  const getPermissionsForRole = useCallback(
    async (roleId: string): Promise<ApiResponse> => {
      return apiRequest(api.getPermissionsForRole, [roleId]);
    },
    [apiRequest]
  );

  const assignRolePermissions = useCallback(
    async (roleId: string, permissionIds: string[]): Promise<ApiResponse> => {
      const payload = { permissionIds };
      console.log('Assigning permission to role:', roleId);
      console.log('Payload sent to assignRolePermissions:', payload);
      return apiRequest(api.assignRolePermissions, [roleId, payload]);
    },
    [apiRequest]
  );

  // const removeRolePermissions = useCallback(
  //   async (roleId: string, permissionIds: string[]): Promise<ApiResponse> => {
  //     return apiRequest(api.removeRolePermissions, [roleId, permissionIds]);
  //   },
  //   [apiRequest]
  // );

  // const removeRolePermissions = useCallback(
  //   async (roleId: string, permissionIds: string[]): Promise<ApiResponse> => {
  //     console.log('Removing permission from role:', roleId);
  //     console.log(
  //       'Permission IDs sent to removeRolePermissions:',
  //       permissionIds
  //     );
  //     return apiRequest(api.removeRolePermissions, [roleId, permissionIds]);
  //   },
  //   [apiRequest]
  // );

  const removeRolePermissions = useCallback(
    async (roleId: string, permissions: string[]): Promise<ApiResponse> => {
      return apiRequest(api.removeRolePermissions, [roleId, permissions]);
    },
    [apiRequest]
  );

  return {
    loading,
    createRole,
    getRoles,
    getRoleById,
    updateRole,
    deleteRole,
    deleteAllRoles,
    bulkCreateRoles,
    getRoleTemplates,
    getPermissionsForRole,
    assignRolePermissions,
    removeRolePermissions,
  };
};
