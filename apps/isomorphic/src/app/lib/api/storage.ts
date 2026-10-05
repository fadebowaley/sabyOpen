import { api } from '../axios';

export type StorageIngestionMode = 'off' | 'auto' | 'force';
export type StorageIngestionStatus =
  | 'pending'
  | 'skipped'
  | 'queued'
  | 'extracting'
  | 'embedded'
  | 'failed'
  | 'not_ingestible';

export interface StorageFile {
  id: string;
  fileId: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageProvider: string;
  storageUrl: string;
  folderId?: string;
  shareSettings?: {
    isShared: boolean;
    shareToken?: string;
    shareExpiry?: Date;
    allowDownload: boolean;
    password?: string;
  };
  metadata?: {
    description?: string;
    tags?: string[];
  };
  ingestionMode?: StorageIngestionMode;
  ingestionStatus?: StorageIngestionStatus;
  ingestionReason?: string | null;
  ingestionError?: string | null;
  embeddedAt?: string | null;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface StorageFolder {
  id: string;
  folderId: string;
  name: string;
  parentFolder?: string;
  path: string;
  shareSettings?: {
    isShared: boolean;
    shareToken?: string;
    allowUpload: boolean;
  };
  metadata?: any;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  avgFileSize: number;
  quota: {
    totalQuota: number;
    usedStorage: number;
  };
  usagePercentage: number;
}

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

export interface PresignUploadRequest {
  filename: string;
  contentType: string;
  size: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export interface PublicDirectUploadResponse {
  fileUrl: string;
  key: string;
}

export interface PublicStagedUploadRequest {
  formId: string;
  fieldId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  reference?: string | null;
  accessToken?: string | null;
  sessionKey?: string | null;
  tenantId?: string | null;
  projectId?: string | null;
}

export interface PublicStagedUploadInitiateResponse {
  uploadId: string;
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresAt?: string;
  fieldId: string;
}

export interface PublicStagedUploadCompleteResponse {
  uploadId: string;
  fileUrl: string;
  key: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  status: string;
  name: string;
}

// File Operations
export const getFiles = async (filters?: FileFilters, token?: string) => {
  console.log('🌐 [API] getFiles called with filters:', filters);
  console.log('🌐 [API] getFiles token present:', !!token);

  const options = {
    params: filters,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  console.log(
    '🌐 [API] getFiles making request to /storage with options:',
    options
  );

  try {
    const { data } = await api.get('/storage', options);
    console.log('✅ [API] getFiles response received:', data);
    return data;
  } catch (error) {
    console.error('❌ [API] getFiles error:', error);
    throw error;
  }
};

export const getFile = async (fileId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/storage/${fileId}`, options);
  return data;
};

export const uploadFile = async (
  formData: FormData,
  token?: string,
  onUploadProgress?: (progressEvent: any) => void
) => {
  const options = {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    onUploadProgress,
  };
  const { data } = await api.post('/storage/upload', formData, options);
  return data;
};

export const uploadMultipleFiles = async (
  formData: FormData,
  token?: string,
  onUploadProgress?: (progressEvent: any) => void
) => {
  const options = {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    onUploadProgress,
  };
  const { data } = await api.post(
    '/storage/upload-multiple',
    formData,
    options
  );
  return data;
};

export const requestPresignedUpload = async (
  payload: PresignUploadRequest
): Promise<PresignUploadResponse> => {
  const response = await fetch('/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to request upload URL');
  }

  return data as PresignUploadResponse;
};

export const requestPublicPresignedUpload = async (
  payload: PresignUploadRequest
): Promise<PresignUploadResponse> => {
  const response = await fetch('/api/public/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to request upload URL');
  }

  return data as PresignUploadResponse;
};

export const uploadToPresignedUrl = async (
  uploadUrl: string,
  file: File
): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl, true);
    request.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    request.setRequestHeader('x-amz-server-side-encryption', 'AES256');

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new Error('Failed to upload file to storage'));
    };

    request.onerror = () => reject(new Error('Failed to upload file to storage'));
    request.onabort = () => reject(new Error('Upload cancelled'));
    request.send(file);
  });

export const uploadFileWithPresign = async (
  file: File
): Promise<PresignUploadResponse> => {
  const presignData = await requestPresignedUpload({
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });

  await uploadToPresignedUrl(presignData.uploadUrl, file);

  return presignData;
};

export const uploadPublicFileWithPresign = async (
  file: File
): Promise<PresignUploadResponse> => {
  const presignData = await requestPublicPresignedUpload({
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });

  await uploadToPresignedUrl(presignData.uploadUrl, file);

  return presignData;
};

export const uploadPublicFile = async (
  file: File
): Promise<PublicDirectUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/public/storage/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (data as any)?.message || 'Failed to upload public file'
    );
  }

  return data as PublicDirectUploadResponse;
};

export const initiatePublicStagedUpload = async (
  payload: PublicStagedUploadRequest
): Promise<PublicStagedUploadInitiateResponse> => {
  const { formId, ...body } = payload;
  const response = await fetch(
    `/api/public/forms/id/${encodeURIComponent(formId)}/uploads/initiate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as any)?.message || 'Failed to initiate upload');
  }

  return data as PublicStagedUploadInitiateResponse;
};

export const completePublicStagedUpload = async (payload: {
  formId: string;
  uploadId: string;
  reference?: string | null;
  accessToken?: string | null;
  sessionKey?: string | null;
  width?: number | null;
  height?: number | null;
}): Promise<PublicStagedUploadCompleteResponse> => {
  const { formId, ...body } = payload;
  const response = await fetch(
    `/api/public/forms/id/${encodeURIComponent(formId)}/uploads/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as any)?.message || 'Failed to complete upload');
  }

  return ((data as any)?.upload || data) as PublicStagedUploadCompleteResponse;
};

export const uploadToPresignedUrlWithProgress = async (
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl, true);
    request.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    request.setRequestHeader('x-amz-server-side-encryption', 'AES256');

    request.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const progress = Math.min(
        100,
        Math.max(0, Math.round((event.loaded / event.total) * 100))
      );
      onProgress(progress);
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error('Failed to upload file to storage'));
    };

    request.onerror = () => reject(new Error('Failed to upload file to storage'));
    request.onabort = () => reject(new Error('Upload was cancelled'));
    request.send(file);
  });

export const deleteFile = async (fileId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(`/storage/${fileId}`, options);
  return data;
};

export const shareFile = async (
  fileId: string,
  shareOptions: {
    expiryDate?: Date;
    allowDownload?: boolean;
    allowPreview?: boolean;
    password?: string;
  },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/storage/${fileId}/share`,
    shareOptions,
    options
  );
  return data;
};

export const moveFile = async (
  fileId: string,
  folderId: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/storage/${fileId}/move`,
    { folderId },
    options
  );
  return data;
};

export const copyFile = async (
  fileId: string,
  payload: { folderId?: string; newName?: string },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(`/storage/${fileId}/copy`, payload, options);
  return data;
};

// Folder Operations
export const getFolders = async (filters?: FolderFilters, token?: string) => {
  const options = {
    params: filters,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/storage/folders', options);
  return data;
};

export const getFolder = async (folderId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/storage/folders/${folderId}`, options);
  return data;
};

export const getFolderContents = async (folderId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(
    `/storage/folders/${folderId}/contents`,
    options
  );
  return data;
};

export const createFolder = async (
  payload: {
    name: string;
    parentFolder?: string;
    metadata?: any;
  },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/storage/folders', payload, options);
  return data;
};

export const updateFolder = async (
  folderId: string,
  payload: { name?: string; metadata?: any },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(
    `/storage/folders/${folderId}`,
    payload,
    options
  );
  return data;
};

export const deleteFolder = async (folderId: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(`/storage/folders/${folderId}`, options);
  return data;
};

export const shareFolder = async (
  folderId: string,
  shareOptions: {
    expiryDate?: Date;
    allowUpload?: boolean;
    password?: string;
  },
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/storage/folders/${folderId}/share`,
    shareOptions,
    options
  );
  return data;
};

export const moveFolder = async (
  folderId: string,
  parentFolder?: string,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post(
    `/storage/folders/${folderId}/move`,
    { parentFolder },
    options
  );
  return data;
};

// Search and Analytics
export const searchFiles = async (query: string, token?: string) => {
  const options = {
    params: { q: query },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/storage/search', options);
  return data;
};

export const getStorageStats = async (token?: string) => {
  console.log('📊 [API] getStorageStats called, token present:', !!token);

  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  console.log('📊 [API] getStorageStats making request to /storage/stats');

  try {
    const { data } = await api.get('/storage/stats', options);
    console.log('✅ [API] getStorageStats response received:', data);
    return data;
  } catch (error) {
    console.error('❌ [API] getStorageStats error:', error);
    throw error;
  }
};

// Shared Access (Public)
export const getSharedFile = async (shareToken: string, password?: string) => {
  const options = {
    params: password ? { password } : {},
  };
  const { data } = await api.get(`/storage/shared/${shareToken}`, options);
  return data;
};

export const downloadSharedFile = async (
  shareToken: string,
  password?: string
) => {
  const options = {
    params: password ? { password } : {},
    responseType: 'blob' as const,
  };
  const { data } = await api.get(
    `/storage/shared/${shareToken}/download`,
    options
  );
  return data;
};

export const getSharedFolder = async (
  shareToken: string,
  password?: string
) => {
  const options = {
    params: password ? { password } : {},
  };
  const { data } = await api.get(
    `/storage/folders/shared/${shareToken}`,
    options
  );
  return data;
};
