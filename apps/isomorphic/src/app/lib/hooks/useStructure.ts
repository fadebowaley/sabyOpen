import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import * as api from '@/app/lib/api/structure';
import toast from 'react-hot-toast';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export const useStructure = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const createStructure = useCallback(async (payload: any): Promise<ApiResponse> => {
    console.log('[USE STRUCTURE - CREATE] Creating structure with token:', token ? 'present' : 'missing');
    setLoading(true);
    try {
      const data = await api.createStructure(payload, token);
      toast.success('Structure created successfully');
      return { success: true, data };
    } catch (err: any) {
      console.error('[USE STRUCTURE - CREATE] Error:', err);
      toast.error('Failed to create structure');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getStructures = useCallback(async (
    query?: Record<string, any>
  ): Promise<ApiResponse> => {
    console.log('[USE STRUCTURE - GET] Fetching structures with token:', token ? 'present' : 'missing', 'query:', query);
    setLoading(true);
    try {
      const data = await api.getStructures(query, token);
      console.log('[USE STRUCTURE - GET] Fetched data:', data);
      return { success: true, data };
    } catch (err: any) {
      console.error('[USE STRUCTURE - GET] Error:', err);
      toast.error('Failed to fetch structures');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getStructure = useCallback(async (structureId: string): Promise<ApiResponse> => {
    console.log('[USE STRUCTURE - GET ONE] Fetching structure:', structureId);
    setLoading(true);
    try {
      const data = await api.getStructure(structureId, token);
      return { success: true, data };
    } catch (err: any) {
      console.error('[USE STRUCTURE - GET ONE] Error:', err);
      toast.error('Failed to fetch structure');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateStructure = useCallback(async (
    structureId: string,
    payload: any
  ): Promise<ApiResponse> => {
    console.log('[USE STRUCTURE - UPDATE] Updating structure:', structureId);
    setLoading(true);
    try {
      const data = await api.updateStructure(structureId, payload, token);
      toast.success('Structure updated successfully');
      return { success: true, data };
    } catch (err: any) {
      console.error('[USE STRUCTURE - UPDATE] Error:', err);
      toast.error('Failed to update structure');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteStructure = useCallback(async (structureId: string): Promise<ApiResponse> => {
    console.log('[USE STRUCTURE - DELETE] Deleting structure:', structureId);
    setLoading(true);
    try {
      await api.deleteStructure(structureId, token);
      toast.success('Structure deleted successfully');
      return { success: true };
    } catch (err: any) {
      console.error('[USE STRUCTURE - DELETE] Error:', err);
      toast.error('Failed to delete structure');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    loading,
    createStructure,
    getStructures,
    getStructure,
    updateStructure,
    deleteStructure,
  };
};
