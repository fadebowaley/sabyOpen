// TEMPORARY TEST FILE for storage API
// This file tests all major exported functions from storage.ts and logs their outputs.
// Remove after successful test run.

import * as storageApi from './storage';

describe('storage API (TEMP)', () => {
  it('should export all expected functions', () => {
    Object.keys(storageApi).forEach((fn) => {
      console.log(
        `Exported function: ${fn}, type:`,
        typeof (storageApi as any)[fn]
      );
    });
    expect(typeof storageApi.getFiles).toBe('function');
    expect(typeof storageApi.getFile).toBe('function');
    expect(typeof storageApi.uploadFile).toBe('function');
    expect(typeof storageApi.uploadMultipleFiles).toBe('function');
    expect(typeof storageApi.deleteFile).toBe('function');
    expect(typeof storageApi.shareFile).toBe('function');
    expect(typeof storageApi.moveFile).toBe('function');
    expect(typeof storageApi.copyFile).toBe('function');
    expect(typeof storageApi.getFolders).toBe('function');
    expect(typeof storageApi.getFolder).toBe('function');
    expect(typeof storageApi.getFolderContents).toBe('function');
    expect(typeof storageApi.createFolder).toBe('function');
    expect(typeof storageApi.updateFolder).toBe('function');
    expect(typeof storageApi.deleteFolder).toBe('function');
    expect(typeof storageApi.shareFolder).toBe('function');
    expect(typeof storageApi.moveFolder).toBe('function');
    expect(typeof storageApi.searchFiles).toBe('function');
    expect(typeof storageApi.getStorageStats).toBe('function');
    expect(typeof storageApi.getSharedFile).toBe('function');
    expect(typeof storageApi.downloadSharedFile).toBe('function');
    expect(typeof storageApi.getSharedFolder).toBe('function');
  });

  it('should call getFiles and log the output', async () => {
    const result = await storageApi.getFiles();
    console.log('getFiles output:', result);
    expect(result).toBeDefined();
  });

  // Add similar tests for getFile, uploadFile, uploadMultipleFiles, deleteFile, shareFile, moveFile, copyFile, getFolders, getFolder, getFolderContents, createFolder, updateFolder, deleteFolder, shareFolder, moveFolder, searchFiles, getStorageStats, getSharedFile, downloadSharedFile, getSharedFolder
});
