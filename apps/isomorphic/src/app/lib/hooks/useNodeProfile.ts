import { useState } from 'react';
import { useSession } from 'next-auth/react';
import * as api from '@/app/lib/api/nodeprofile';
import toast from 'react-hot-toast';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export const useNodeProfile = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const getNodeProfile = async (nodeId: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.getNodeProfile(nodeId, token);
      return { success: true, data };
    } catch (err: any) {
      // Don't show error toast for 404 (profile doesn't exist yet)
      if (err?.response?.status !== 404) {
        toast.error('Failed to fetch node profile');
      }
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const createNodeProfile = async (payload: any): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.createNodeProfile(payload, token);
      toast.success('Profile created successfully');
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to create profile');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const updateNodeProfile = async (
    profileId: string,
    payload: any
  ): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.updateNodeProfile(profileId, payload, token);
      toast.success('Profile updated successfully');
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to update profile');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const upsertNodeProfile = async (payload: any): Promise<ApiResponse> => {
    setLoading(true);
    try {
      const data = await api.upsertNodeProfile(payload, token);
      toast.success('Profile saved successfully');
      return { success: true, data };
    } catch (err: any) {
      toast.error('Failed to save profile');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteNodeProfile = async (profileId: string): Promise<ApiResponse> => {
    setLoading(true);
    try {
      await api.deleteNodeProfile(profileId, token);
      toast.success('Profile deleted successfully');
      return { success: true };
    } catch (err: any) {
      toast.error('Failed to delete profile');
      return { success: false, error: err?.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getNodeProfile,
    createNodeProfile,
    updateNodeProfile,
    upsertNodeProfile,
    deleteNodeProfile,
  };
};

