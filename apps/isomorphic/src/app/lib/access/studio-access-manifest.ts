import { BACKEND_PERMISSIONS } from "@/app/lib/access/backend-permissions";

export const STUDIO_ACCESS_MANIFEST = {
  dashboard: {
    permissions: [],
  },
  forms: {
    list: {
      permissions: [BACKEND_PERMISSIONS.projectForm.view],
    },
    create: {
      permissions: [BACKEND_PERMISSIONS.projectForm.create],
    },
    edit: {
      permissions: [BACKEND_PERMISSIONS.projectForm.update],
    },
    delete: {
      permissions: [BACKEND_PERMISSIONS.projectForm.delete],
    },
  },
  data: {
    list: {
      permissions: [BACKEND_PERMISSIONS.submission.read],
    },
    update: {
      permissions: [BACKEND_PERMISSIONS.submission.update],
    },
    delete: {
      permissions: [BACKEND_PERMISSIONS.submission.delete],
    },
    export: {
      permissions: [BACKEND_PERMISSIONS.export.read],
    },
    analytics: {
      permissions: [BACKEND_PERMISSIONS.analytics.read],
    },
  },
  files: {
    list: {
      permissions: [
        BACKEND_PERMISSIONS.storage.read,
        BACKEND_PERMISSIONS.storage.viewFile,
      ],
    },
    update: {
      permissions: [BACKEND_PERMISSIONS.storage.updateFile],
    },
    delete: {
      permissions: [BACKEND_PERMISSIONS.storage.deleteFile],
    },
  },
  integrations: {
    list: {
      permissions: [BACKEND_PERMISSIONS.apiKey.read],
    },
  },
  approvals: {
    list: {
      permissions: [BACKEND_PERMISSIONS.submission.read],
    },
    act: {
      permissions: [BACKEND_PERMISSIONS.submission.update],
    },
  },
} as const;

export type StudioAccessManifest = typeof STUDIO_ACCESS_MANIFEST;
