// TEMPORARY TEST FILE for useStorage hook
// This file tests all major methods of the useStorage hook and logs their outputs.
// Remove after successful test run.

import { renderHook, act } from '@testing-library/react-hooks';
import { useStorage } from './useStorage';
import { SessionProvider } from 'next-auth/react';

describe('useStorage Hook (TEMP)', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useStorage(), {
      wrapper: ({ children }) => (
        <SessionProvider session={null}>{children}</SessionProvider>
      ),
    });
    console.log('Initial loading:', result.current.loading);
    console.log('Initial uploadProgress:', result.current.uploadProgress);
    expect(result.current.loading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
  });

  it('should call getFiles and log the response', async () => {
    const { result } = renderHook(() => useStorage(), {
      wrapper: ({ children }) => (
        <SessionProvider session={null}>{children}</SessionProvider>
      ),
    });
    const response = await result.current.getFiles();
    console.log('getFiles output:', response);
    expect(response).toHaveProperty('success');
  });

  it('should call getFile and log the response', async () => {
    const { result } = renderHook(() => useStorage(), {
      wrapper: ({ children }) => (
        <SessionProvider session={null}>{children}</SessionProvider>
      ),
    });
    const response = await result.current.getFile('dummy-id');
    console.log('getFile output:', response);
    expect(response).toHaveProperty('success');
  });

  it('should call uploadFile and log the response', async () => {
    const { result } = renderHook(() => useStorage(), {
      wrapper: ({ children }) => (
        <SessionProvider session={null}>{children}</SessionProvider>
      ),
    });
    // Use a dummy file
    const file = new File(['dummy content'], 'dummy.txt', {
      type: 'text/plain',
    });
    const response = await result.current.uploadFile(file);
    console.log('uploadFile output:', response);
    expect(response).toHaveProperty('success');
  });

  it('should call uploadMultipleFiles and log the response', async () => {
    const { result } = renderHook(() => useStorage(), {
      wrapper: ({ children }) => (
        <SessionProvider session={null}>{children}</SessionProvider>
      ),
    });
    const files = [
      new File(['dummy content'], 'dummy1.txt', { type: 'text/plain' }),
    ];
    const response = await result.current.uploadMultipleFiles(files);
    console.log('uploadMultipleFiles output:', response);
    expect(response).toHaveProperty('success');
  });

  it('should call deleteFile and log the response', async () => {
    const { result } = renderHook(() => useStorage(), {
      wrapper: ({ children }) => (
        <SessionProvider session={null}>{children}</SessionProvider>
      ),
    });
    const response = await result.current.deleteFile('dummy-id');
    console.log('deleteFile output:', response);
    expect(response).toHaveProperty('success');
  });

  // Add similar tests for shareFile, moveFile, copyFile, getFolders, getFolder, getFolderContents, createFolder, updateFolder, deleteFolder, shareFolder, moveFolder, searchFiles, getStorageStats, getSharedFile, downloadSharedFile, getSharedFolder
});
