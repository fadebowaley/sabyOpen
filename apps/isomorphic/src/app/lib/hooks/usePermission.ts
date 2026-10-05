// import { useState } from 'react';
// import * as api from '@/app/lib/api/permissions';
// import toast from 'react-hot-toast';

// type ApiResponse = {
//   success: boolean;
//   data?: any;
//   error?: string;
// };

// export const usePermission = () => {
//   const [loading, setLoading] = useState(false);

//   const createPermission = async (payload: any): Promise<ApiResponse> => {
//     setLoading(true);
//     try {
//       const data = await api.createPermission(payload);
//       toast.success('Permission created successfully');
//       return { success: true, data };
//     } catch (err: any) {
//       toast.error('Failed to create permission');
//       return { success: false, error: err?.response?.data?.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getPermissions = async (
//     query?: Record<string, any>
//   ): Promise<ApiResponse> => {
//     setLoading(true);
//     try {
//       const data = await api.getPermissions(query);
//       return { success: true, data };
//     } catch (err: any) {
//       toast.error('Failed to fetch permissions');
//       return { success: false, error: err?.response?.data?.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getPermission = async (
//     permissionName: string
//   ): Promise<ApiResponse> => {
//     setLoading(true);
//     try {
//       const data = await api.getPermission(permissionName);
//       return { success: true, data };
//     } catch (err: any) {
//       toast.error('Failed to fetch permission');
//       return { success: false, error: err?.response?.data?.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updatePermission = async (
//     permissionName: string,
//     payload: any
//   ): Promise<ApiResponse> => {
//     setLoading(true);
//     try {
//       const data = await api.updatePermission(permissionName, payload);
//       toast.success('Permission updated successfully');
//       return { success: true, data };
//     } catch (err: any) {
//       toast.error('Failed to update permission');
//       return { success: false, error: err?.response?.data?.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deletePermission = async (
//     permissionName: string
//   ): Promise<ApiResponse> => {
//     setLoading(true);
//     try {
//       await api.deletePermission(permissionName);
//       toast.success('Permission deleted successfully');
//       return { success: true };
//     } catch (err: any) {
//       toast.error('Failed to delete permission');
//       return { success: false, error: err?.response?.data?.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const bulkCreatePermissions = async (
//     payload: any[]
//   ): Promise<ApiResponse> => {
//     setLoading(true);
//     try {
//       const data = await api.bulkCreatePermissions(payload);
//       toast.success('Bulk permission creation successful');
//       return { success: true, data };
//     } catch (err: any) {
//       toast.error('Failed to create permissions in bulk');
//       return { success: false, error: err?.response?.data?.message };
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     loading,
//     createPermission,
//     getPermissions,
//     getPermission,
//     updatePermission,
//     deletePermission,
//     bulkCreatePermissions,
//   };
// };
'use client';

import { useState, useCallback } from 'react';
import * as api from '@/app/lib/api/permissions';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export const usePermission = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const apiRequest = useCallback(
    async (
      apiFunc: Function,
      params: any[] = [],
      successMsg?: string,
      errorMsg?: string
    ): Promise<ApiResponse> => {
      setLoading(true);
      try {
        const result = await apiFunc(...params, token);
        if (successMsg) toast.success(successMsg);
        return { success: true, data: result };
      } catch (err: any) {
        const message =
          err?.response?.data?.message || errorMsg || 'An error occurred';
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const createPermission = useCallback(
    async (payload: any): Promise<ApiResponse> =>
      apiRequest(
        api.createPermission,
        [payload],
        'Permission created successfully',
        'Failed to create permission'
      ),
    [apiRequest]
  );

  const getPermissions = useCallback(
    async (query?: Record<string, any>): Promise<ApiResponse> =>
      apiRequest(
        api.getPermissions,
        [query],
        undefined,
        'Failed to fetch permissions'
      ),
    [apiRequest]
  );

  const getPermission = useCallback(
    async (permissionName: string): Promise<ApiResponse> =>
      apiRequest(
        api.getPermission,
        [permissionName],
        undefined,
        'Failed to fetch permission'
      ),
    [apiRequest]
  );

  const updatePermission = useCallback(
    async (permissionName: string, payload: any): Promise<ApiResponse> =>
      apiRequest(
        api.updatePermission,
        [permissionName, payload],
        'Permission updated successfully',
        'Failed to update permission'
      ),
    [apiRequest]
  );

  const deletePermission = useCallback(
    async (permissionName: string): Promise<ApiResponse> =>
      apiRequest(
        api.deletePermission,
        [permissionName],
        'Permission deleted successfully',
        'Failed to delete permission'
      ),
    [apiRequest]
  );

  const bulkCreatePermissions = useCallback(
    async (payload: any[]): Promise<ApiResponse> =>
      apiRequest(
        api.bulkCreatePermissions,
        [payload],
        'Bulk permission creation successful',
        'Failed to create permissions in bulk'
      ),
    [apiRequest]
  );

  return {
    loading,
    createPermission,
    getPermissions,
    getPermission,
    updatePermission,
    deletePermission,
    bulkCreatePermissions,
  };
};
