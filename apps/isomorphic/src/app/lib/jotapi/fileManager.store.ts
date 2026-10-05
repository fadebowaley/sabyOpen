import { atom } from 'jotai';
import * as api from '@/app/lib/api/storage';
import toast from 'react-hot-toast';
import { getSession } from 'next-auth/react';

type UploadQueueStatus = 'pending' | 'uploading' | 'finalizing' | 'done' | 'failed';

export interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadQueueStatus;
}

// Atoms for state
export const filesAtom = atom<any[]>([]);
export const foldersAtom = atom<any[]>([]);
export const statsAtom = atom<any | null>(null);
export const loadingAtom = atom(false);
export const errorAtom = atom<string | null>(null);
export const uploadProgressAtom = atom(0);
export const uploadStageAtom = atom<'idle' | 'uploading' | 'finalizing'>(
  'idle'
);
export const uploadQueueAtom = atom<UploadQueueItem[]>([]);
export const resetUploadUiAtom = atom(null, (get, set) => {
  set(uploadProgressAtom, 0);
  set(uploadStageAtom, 'idle');
  set(uploadQueueAtom, []);
});

const buildQueueItems = (files: File[]): UploadQueueItem[] =>
  files.map((file, index) => ({
    id: `${file.name}-${file.size}-${index}`,
    name: file.name,
    size: file.size,
    progress: 0,
    status: 'pending',
  }));

// Actions
export const fetchFilesAtom = atom(null, async (get, set, filters?: any) => {
  console.log(
    '🚀 [Jotai] fetchFilesAtom START - called with filters:',
    filters
  );
  set(loadingAtom, true);
  set(errorAtom, null);
  try {
    const session = await getSession();
    const token = session?.user?.accessToken;
    console.log(
      '🔑 [Jotai] fetchFilesAtom - session token:',
      token ? 'present' : 'missing'
    );
    console.log('📞 [Jotai] fetchFilesAtom - calling api.getFiles...');
    const result = await api.getFiles(filters, token);
    console.log('✅ [Jotai] fetchFilesAtom - api.getFiles result:', result);
    console.log('📊 [Jotai] fetchFilesAtom - result.results:', result.results);
    const filesToSet = result.results || [];
    console.log(
      '💾 [Jotai] fetchFilesAtom - setting filesAtom with:',
      filesToSet
    );
    set(filesAtom, filesToSet);
    console.log('✅ [Jotai] fetchFilesAtom - filesAtom set successfully');
  } catch (err: any) {
    console.error('❌ [Jotai] fetchFilesAtom error:', err);
    set(errorAtom, err?.response?.data?.message || 'Failed to fetch files');
    toast.error(err?.response?.data?.message || 'Failed to fetch files');
  } finally {
    set(loadingAtom, false);
    console.log('🏁 [Jotai] fetchFilesAtom END - loading set to false');
  }
});

export const fetchFoldersAtom = atom(null, async (get, set, filters?: any) => {
  set(loadingAtom, true);
  set(errorAtom, null);
  try {
    const session = await getSession();
    const token = session?.user?.accessToken;
    console.debug('[Jotai] fetchFoldersAtom called with filters:', filters);
    const result = await api.getFolders(filters, token);
    console.debug('[Jotai] fetchFoldersAtom received:', result);
    set(foldersAtom, result.results || []);
  } catch (err: any) {
    set(errorAtom, err?.response?.data?.message || 'Failed to fetch folders');
    toast.error(err?.response?.data?.message || 'Failed to fetch folders');
    console.error('[Jotai] fetchFoldersAtom error:', err);
  } finally {
    set(loadingAtom, false);
  }
});


export const fetchStatsAtom = atom(null, async (get, set) => {
  set(loadingAtom, true);
  set(errorAtom, null);
  try {
    const session = await getSession();
    const token = session?.user?.accessToken;
    const result = await api.getStorageStats(token); // this returns the stats object directly
    // ✅ FIXED: set directly
    set(statsAtom, result || null);
  } catch (err: any) {
    set(errorAtom, err?.response?.data?.message || 'Failed to fetch stats');
    toast.error(err?.response?.data?.message || 'Failed to fetch stats');
    console.error('[Jotai] fetchStatsAtom error:', err);
  } finally {
    set(loadingAtom, false);
  }
});

// Mutations (all trigger refresh of files and stats)
export const deleteFileAtom = atom(null, async (get, set, fileId: string) => {
  set(loadingAtom, true);
  set(errorAtom, null);
  try {
    const session = await getSession();
    const token = session?.user?.accessToken;
    await api.deleteFile(fileId, token);
    toast.success('File deleted successfully');
    await set(fetchFilesAtom);
    await set(fetchStatsAtom);
  } catch (err: any) {
    set(errorAtom, err?.response?.data?.message || 'Failed to delete file');
    toast.error(err?.response?.data?.message || 'Failed to delete file');
  } finally {
    set(loadingAtom, false);
  }
});

export const uploadFileAtom = atom(
  null,
  async (
    get,
    set,
    {
      file,
      folderId,
      description,
      ingestionMode = 'auto',
    }: {
      file: File;
      folderId?: string;
      description?: string;
      ingestionMode?: api.StorageIngestionMode;
    }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);
    set(uploadProgressAtom, 0);
    set(uploadStageAtom, 'uploading');
    set(uploadQueueAtom, buildQueueItems([file]));
    try {
      const session = await getSession();
      const token = session?.user?.accessToken;
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folderId', folderId);
      if (description) formData.append('description', description);
      formData.append('ingestionMode', ingestionMode);
      await api.uploadFile(formData, token, (progressEvent) => {
        const total = progressEvent.total ?? file.size;
        const progress = total
          ? Math.min(100, Math.round((progressEvent.loaded * 100) / total))
          : 0;
        set(uploadProgressAtom, progress);
        set(uploadQueueAtom, (items) =>
          items.map((item) => ({
            ...item,
            progress,
            status: progress >= 100 ? 'finalizing' : 'uploading',
          }))
        );
      });
      set(uploadStageAtom, 'finalizing');
      set(uploadQueueAtom, (items) =>
        items.map((item) => ({ ...item, progress: 100, status: 'done' }))
      );
      toast.success('File uploaded successfully');
      await set(fetchFilesAtom);
      await set(fetchStatsAtom);
    } catch (err: any) {
      set(uploadQueueAtom, (items) =>
        items.map((item) => ({ ...item, status: 'failed' }))
      );
      set(errorAtom, err?.response?.data?.message || 'Failed to upload file');
      toast.error(err?.response?.data?.message || 'Failed to upload file');
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Move File
export const moveFileAtom = atom(
  null,
  async (
    get,
    set,
    { fileId, folderId }: { fileId: string; folderId: string }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);
    try {
      const session = await getSession();
      const token = session?.user?.accessToken;
      await api.moveFile(fileId, folderId, token);
      toast.success('File moved successfully');
      await set(fetchFilesAtom);
      await set(fetchStatsAtom);
    } catch (err: any) {
      set(errorAtom, err?.response?.data?.message || 'Failed to move file');
      toast.error(err?.response?.data?.message || 'Failed to move file');
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Copy File
export const copyFileAtom = atom(
  null,
  async (
    get,
    set,
    {
      fileId,
      payload,
    }: { fileId: string; payload: { folderId?: string; newName?: string } }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);
    try {
      const session = await getSession();
      const token = session?.user?.accessToken;
      await api.copyFile(fileId, payload, token);
      toast.success('File copied successfully');
      await set(fetchFilesAtom);
      await set(fetchStatsAtom);
    } catch (err: any) {
      set(errorAtom, err?.response?.data?.message || 'Failed to copy file');
      toast.error(err?.response?.data?.message || 'Failed to copy file');
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Share File
export const shareFileAtom = atom(
  null,
  async (
    get,
    set,
    {
      fileId,
      shareOptions,
    }: {
      fileId: string;
      shareOptions: {
        expiryDate?: Date;
        allowDownload?: boolean;
        allowPreview?: boolean;
        password?: string;
      };
    }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);
    try {
      const session = await getSession();
      const token = session?.user?.accessToken;
      const result = await api.shareFile(fileId, shareOptions, token);
      toast.success('File shared successfully');
      await set(fetchFilesAtom);
      await set(fetchStatsAtom);
      return result;
    } catch (err: any) {
      set(errorAtom, err?.response?.data?.message || 'Failed to share file');
      toast.error(err?.response?.data?.message || 'Failed to share file');
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Upload Multiple Files
export const uploadMultipleFilesAtom = atom(
  null,
  async (
    get,
    set,
    {
      files,
      folderId,
      ingestionMode = 'auto',
    }: {
      files: File[];
      folderId?: string;
      ingestionMode?: api.StorageIngestionMode;
    }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);
    set(uploadProgressAtom, 0);
    set(uploadStageAtom, 'uploading');
    set(uploadQueueAtom, buildQueueItems(files));
    try {
      const session = await getSession();
      const token = session?.user?.accessToken;
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      if (folderId) formData.append('folderId', folderId);
      formData.append('ingestionMode', ingestionMode);
      await api.uploadMultipleFiles(formData, token, (progressEvent) => {
        const total = progressEvent.total ?? files.reduce((sum, file) => sum + file.size, 0);
        const progress = total
          ? Math.min(100, Math.round((progressEvent.loaded * 100) / total))
          : 0;
        set(uploadProgressAtom, progress);
        set(uploadQueueAtom, (items) =>
          items.map((item) => ({
            ...item,
            progress,
            status: progress >= 100 ? 'finalizing' : 'uploading',
          }))
        );
      });
      set(uploadStageAtom, 'finalizing');
      set(uploadQueueAtom, (items) =>
        items.map((item) => ({ ...item, progress: 100, status: 'done' }))
      );
      toast.success(`${files.length} files uploaded successfully`);
      await set(fetchFilesAtom);
      await set(fetchStatsAtom);
    } catch (err: any) {
      set(uploadQueueAtom, (items) =>
        items.map((item) => ({ ...item, status: 'failed' }))
      );
      set(errorAtom, err?.response?.data?.message || 'Failed to upload files');
      toast.error(err?.response?.data?.message || 'Failed to upload files');
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Create Folder
export const createFolderAtom = atom(
  null,
  async (
    get,
    set,
    payload: { name: string; parentFolder?: string; metadata?: any }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);
    try {
      const session = await getSession();
      const token = session?.user?.accessToken;
      await api.createFolder(payload, token);
      toast.success('Folder created successfully');
      await set(fetchFoldersAtom);
      await set(fetchStatsAtom);
    } catch (err: any) {
      set(errorAtom, err?.response?.data?.message || 'Failed to create folder');
      toast.error(err?.response?.data?.message || 'Failed to create folder');
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Update Folder
export const updateFolderAtom = atom(
  null,
  async (
    get,
    set,
    {
      folderId,
      payload,
    }: { folderId: string; payload: { name?: string; metadata?: any } }
  ) => {
    set(loadingAtom, true);
    set(errorAtom, null);
    try {
      const session = await getSession();
      const token = session?.user?.accessToken;
      await api.updateFolder(folderId, payload, token);
      toast.success('Folder updated successfully');
      await set(fetchFoldersAtom);
      await set(fetchStatsAtom);
    } catch (err: any) {
      set(errorAtom, err?.response?.data?.message || 'Failed to update folder');
      toast.error(err?.response?.data?.message || 'Failed to update folder');
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Delete Folder
export const deleteFolderAtom = atom(
  null,
  async (get, set, folderId: string) => {
    set(loadingAtom, true);
    set(errorAtom, null);
    try {
      const session = await getSession();
      const token = session?.user?.accessToken;
      await api.deleteFolder(folderId, token);
      toast.success('Folder deleted successfully');
      await set(fetchFoldersAtom);
      await set(fetchStatsAtom);
    } catch (err: any) {
      set(errorAtom, err?.response?.data?.message || 'Failed to delete folder');
      toast.error(err?.response?.data?.message || 'Failed to delete folder');
    } finally {
      set(loadingAtom, false);
    }
  }
);
