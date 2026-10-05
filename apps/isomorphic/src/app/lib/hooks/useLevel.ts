import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as api from '@/app/lib/api/level';
import toast from 'react-hot-toast';
import { levelQueryKeys } from './useLevelsQuery';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export const useLevel = () => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const createLevel = useCallback(async (payload: any): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.createLevel(payload);
      toast.success('Level created successfully');
      
      // Invalidate levels cache to trigger refetch
      const tenantId = payload.tenantId || (payload as any).tenant?.id;
      queryClient.invalidateQueries({ queryKey: levelQueryKeys.tenant(tenantId) });
      
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to create level');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const getLevels = useCallback(async (
    query?: Record<string, any>
  ): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.getLevels(query);
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to fetch levels');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getLevelById = useCallback(async (levelId: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.getLevelById(levelId);
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to fetch level');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLevelById = useCallback(async (
    levelId: string,
    payload: any
  ): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.updateLevelById(levelId, payload);
      toast.success('Level updated successfully');
      
      // Invalidate levels cache
      const tenantId = payload.tenantId || (payload as any).tenant?.id;
      queryClient.invalidateQueries({ queryKey: levelQueryKeys.tenant(tenantId) });
      
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to update level');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const deleteLevelById = useCallback(async (levelId: string, tenantId?: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      await api.deleteLevelById(levelId);
      toast.success('Level deleted successfully');
      
      // Always invalidate levels cache to ensure UI updates immediately
      // If tenantId is provided, invalidate that tenant's cache; otherwise invalidate all
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: levelQueryKeys.tenant(tenantId) });
      } else {
        // Invalidate all level queries to ensure deleted level disappears from all caches
        // This is safer when tenantId is not available (e.g., from backend scripts)
        queryClient.invalidateQueries({ queryKey: levelQueryKeys.all });
      }
      
      return { success: true };
    } catch (err: any) {
      toast.error('Failed to delete level');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const getLevelsByHierarchy = useCallback(async (): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.getLevelsByHierarchy();
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to fetch hierarchy');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getParentLevel = useCallback(async (levelId: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.getParentLevel(levelId);
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to fetch parent level');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getChildLevels = useCallback(async (levelId: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.getChildLevels(levelId);
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to fetch child levels');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const activateLevel = useCallback(async (levelId: string, tenantId?: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.activateLevel(levelId);
      toast.success('Level activated');
      
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: levelQueryKeys.tenant(tenantId) });
      } else {
        queryClient.invalidateQueries({ queryKey: levelQueryKeys.all });
      }
      
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to activate level');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const deactivateLevel = useCallback(async (levelId: string, tenantId?: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.deactivateLevel(levelId);
      toast.success('Level deactivated');
      
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: levelQueryKeys.tenant(tenantId) });
      } else {
        queryClient.invalidateQueries({ queryKey: levelQueryKeys.all });
      }
      
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to deactivate level');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const moveLevelToParent = useCallback(async (
    levelId: string,
    payload: any,
    tenantId?: string
  ): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.moveLevelToParent(levelId, payload);
      toast.success('Level moved to new parent');
      
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: levelQueryKeys.tenant(tenantId) });
      } else {
        queryClient.invalidateQueries({ queryKey: levelQueryKeys.all });
      }
      
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to move level');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  return {
    loading,
    createLevel,
    getLevels,
    getLevelById,
    updateLevelById,
    deleteLevelById,
    getLevelsByHierarchy,
    getParentLevel,
    getChildLevels,
    activateLevel,
    deactivateLevel,
    moveLevelToParent,
  };
};
