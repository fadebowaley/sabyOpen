import { useState, useCallback } from 'react';
import * as api from '@/app/lib/api/storage';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

interface FileFilters {
  page?: number;
  limit?: number;
  folderId?: string;
  mimeType?: string;
  fileExtension?: string;
}

interface FolderFilters {
  page?: number;
  limit?: number;
  parentFolder?: string;
}

export const useStorage = () => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const apiRequest = useCallback(
    async (apiFunc: Function, params: any[] = []): Promise<ApiResponse> => {
      setLoading(true);
      try {
        const result = await apiFunc(...params, token);
        return { success: true, data: result };
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || 'An error occurred';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // File Operations
  const getFiles = useCallback(
    async (filters?: FileFilters): Promise<ApiResponse> => {
      return apiRequest(api.getFiles, [filters]);
    },
    [apiRequest]
  );

  const getFile = useCallback(
    async (fileId: string): Promise<ApiResponse> => {
      return apiRequest(api.getFile, [fileId]);
    },
    [apiRequest]
  );

  const uploadFile = useCallback(
    async (file: File, folderId?: string, description?: string): Promise<ApiResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folderId', folderId);
      if (description) formData.append('description', description);

      return apiRequest(api.uploadFile, [formData]);
    },
    [apiRequest]
  );

  const uploadMultipleFiles = useCallback(
    async (files: File[], folderId?: string): Promise<ApiResponse> => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      if (folderId) formData.append('folderId', folderId);

      return apiRequest(api.uploadMultipleFiles, [formData]);
    },
    [apiRequest]
  );

  const uploadFileWithPresign = useCallback(
    async (file: File): Promise<ApiResponse> => {
      setLoading(true);
      try {
        const data = await api.uploadFileWithPresign(file);
        return { success: true, data };
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to upload file';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<ApiResponse> => {
      const result = await apiRequest(api.deleteFile, [fileId]);
      if (result.success) {
        toast.success('File deleted successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const shareFile = useCallback(
    async (
      fileId: string,
      shareOptions: {
        expiryDate?: Date;
        allowDownload?: boolean;
        allowPreview?: boolean;
        password?: string;
      }
    ): Promise<ApiResponse> => {
      const result = await apiRequest(api.shareFile, [fileId, shareOptions]);
      if (result.success) {
        toast.success('File shared successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const moveFile = useCallback(
    async (fileId: string, folderId: string): Promise<ApiResponse> => {
      const result = await apiRequest(api.moveFile, [fileId, folderId]);
      if (result.success) {
        toast.success('File moved successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const copyFile = useCallback(
    async (
      fileId: string,
      payload: { folderId?: string; newName?: string }
    ): Promise<ApiResponse> => {
      const result = await apiRequest(api.copyFile, [fileId, payload]);
      if (result.success) {
        toast.success('File copied successfully');
      }
      return result;
    },
    [apiRequest]
  );

  // Folder Operations
  const getFolders = useCallback(
    async (filters?: FolderFilters): Promise<ApiResponse> => {
      return apiRequest(api.getFolders, [filters]);
    },
    [apiRequest]
  );

  const getFolder = useCallback(
    async (folderId: string): Promise<ApiResponse> => {
      return apiRequest(api.getFolder, [folderId]);
    },
    [apiRequest]
  );

  const getFolderContents = useCallback(
    async (folderId: string): Promise<ApiResponse> => {
      return apiRequest(api.getFolderContents, [folderId]);
    },
    [apiRequest]
  );

  const createFolder = useCallback(
    async (payload: {
      name: string;
      parentFolder?: string;
      metadata?: any;
    }): Promise<ApiResponse> => {
      const result = await apiRequest(api.createFolder, [payload]);
      if (result.success) {
        toast.success('Folder created successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const updateFolder = useCallback(
    async (
      folderId: string,
      payload: { name?: string; metadata?: any }
    ): Promise<ApiResponse> => {
      const result = await apiRequest(api.updateFolder, [folderId, payload]);
      if (result.success) {
        toast.success('Folder updated successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const deleteFolder = useCallback(
    async (folderId: string): Promise<ApiResponse> => {
      const result = await apiRequest(api.deleteFolder, [folderId]);
      if (result.success) {
        toast.success('Folder deleted successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const shareFolder = useCallback(
    async (
      folderId: string,
      shareOptions: {
        expiryDate?: Date;
        allowUpload?: boolean;
        password?: string;
      }
    ): Promise<ApiResponse> => {
      const result = await apiRequest(api.shareFolder, [folderId, shareOptions]);
      if (result.success) {
        toast.success('Folder shared successfully');
      }
      return result;
    },
    [apiRequest]
  );

  const moveFolder = useCallback(
    async (folderId: string, parentFolder?: string): Promise<ApiResponse> => {
      const result = await apiRequest(api.moveFolder, [folderId, parentFolder]);
      if (result.success) {
        toast.success('Folder moved successfully');
      }
      return result;
    },
    [apiRequest]
  );

  // Search and Analytics
  const searchFiles = useCallback(
    async (query: string): Promise<ApiResponse> => {
      return apiRequest(api.searchFiles, [query]);
    },
    [apiRequest]
  );

  const getStorageStats = useCallback(
    async (): Promise<ApiResponse> => {
      return apiRequest(api.getStorageStats, []);
    },
    [apiRequest]
  );

  // Shared Access
  const getSharedFile = useCallback(
    async (shareToken: string, password?: string): Promise<ApiResponse> => {
      return apiRequest(api.getSharedFile, [shareToken, password]);
    },
    [apiRequest]
  );

  const downloadSharedFile = useCallback(
    async (shareToken: string, password?: string): Promise<ApiResponse> => {
      return apiRequest(api.downloadSharedFile, [shareToken, password]);
    },
    [apiRequest]
  );

  const getSharedFolder = useCallback(
    async (shareToken: string, password?: string): Promise<ApiResponse> => {
      return apiRequest(api.getSharedFolder, [shareToken, password]);
    },
    [apiRequest]
  );

  return {
    loading,
    uploadProgress,
    // File operations
    getFiles,
    getFile,
    uploadFile,
    uploadMultipleFiles,
    uploadFileWithPresign,
    deleteFile,
    shareFile,
    moveFile,
    copyFile,
    // Folder operations
    getFolders,
    getFolder,
    getFolderContents,
    createFolder,
    updateFolder,
    deleteFolder,
    shareFolder,
    moveFolder,
    // Search and analytics
    searchFiles,
    getStorageStats,
    // Shared access
    getSharedFile,
    downloadSharedFile,
    getSharedFolder,
  };
};
