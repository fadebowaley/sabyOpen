import { useState, useCallback } from 'react';
import * as api from '@/app/lib/api/userProfile';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export const useUserProfile = () => {
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

  const getUserProfile = useCallback(
    async (userId: string): Promise<ApiResponse> => {
      return apiRequest(api.getUserProfile, [userId]);
    },
    [apiRequest]
  );

  const upsertUserProfile = useCallback(
    async (userId: string, payload: any): Promise<ApiResponse> => {
      return apiRequest(api.upsertUserProfile, [userId, payload]);
    },
    [apiRequest]
  );

  const deleteUserProfile = useCallback(
    async (userId: string): Promise<ApiResponse> => {
      return apiRequest(api.deleteUserProfile, [userId]);
    },
    [apiRequest]
  );

  return {
    loading,
    getUserProfile,
    upsertUserProfile,
    deleteUserProfile,
  };
};

