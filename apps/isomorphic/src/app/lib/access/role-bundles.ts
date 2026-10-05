import { BACKEND_PERMISSIONS } from "@/app/lib/access/backend-permissions";

export const WORKSPACE_DATA_ADMINISTRATOR_ROLE = "Workspace Data Administrator";
export const WORKSPACE_EDITOR_ROLE = "Workspace Editor";
export const WORKSPACE_VIEWER_ROLE = "Workspace Viewer";
export const WORKSPACE_OWNER_ROLE = "Workspace Owner";

export const WORKSPACE_ROLE_BUNDLES = {
  [WORKSPACE_OWNER_ROLE]: {
    label: "Workspace Owner",
    description:
      "Acts as a co-owner within assigned workspaces for forms, records, reports, and vault operations, without team invitation access.",
    permissions: [
      BACKEND_PERMISSIONS.projectForm.view,
      BACKEND_PERMISSIONS.projectForm.create,
      BACKEND_PERMISSIONS.projectForm.update,
      BACKEND_PERMISSIONS.projectForm.delete,
      BACKEND_PERMISSIONS.submission.read,
      BACKEND_PERMISSIONS.submission.update,
      BACKEND_PERMISSIONS.submission.delete,
      BACKEND_PERMISSIONS.report.read,
      BACKEND_PERMISSIONS.export.read,
      BACKEND_PERMISSIONS.analytics.read,
      BACKEND_PERMISSIONS.storage.read,
      BACKEND_PERMISSIONS.storage.viewFile,
      BACKEND_PERMISSIONS.storage.updateFile,
      BACKEND_PERMISSIONS.storage.deleteFile,
      BACKEND_PERMISSIONS.storage.shareFile,
      BACKEND_PERMISSIONS.storage.viewFolder,
      BACKEND_PERMISSIONS.storage.updateFolder,
      BACKEND_PERMISSIONS.storage.deleteFolder,
      BACKEND_PERMISSIONS.storage.shareFolder,
    ],
  },
  [WORKSPACE_DATA_ADMINISTRATOR_ROLE]: {
    label: "Data Administrator",
    description:
      "Manages workspace form data, exports, records updates, and approval-related operations.",
    permissions: [
      BACKEND_PERMISSIONS.projectForm.view,
      BACKEND_PERMISSIONS.submission.read,
      BACKEND_PERMISSIONS.submission.update,
      BACKEND_PERMISSIONS.submission.delete,
      BACKEND_PERMISSIONS.report.read,
      BACKEND_PERMISSIONS.export.read,
      BACKEND_PERMISSIONS.analytics.read,
      BACKEND_PERMISSIONS.storage.read,
      BACKEND_PERMISSIONS.storage.viewFile,
      BACKEND_PERMISSIONS.storage.updateFile,
      BACKEND_PERMISSIONS.storage.viewFolder,
    ],
  },
  [WORKSPACE_EDITOR_ROLE]: {
    label: "Editor",
    description:
      "Builds and updates forms within assigned workspaces and can inspect related submissions.",
    permissions: [
      BACKEND_PERMISSIONS.projectForm.view,
      BACKEND_PERMISSIONS.projectForm.create,
      BACKEND_PERMISSIONS.projectForm.update,
      BACKEND_PERMISSIONS.submission.read,
      BACKEND_PERMISSIONS.storage.read,
      BACKEND_PERMISSIONS.storage.viewFile,
      BACKEND_PERMISSIONS.storage.viewFolder,
    ],
  },
  [WORKSPACE_VIEWER_ROLE]: {
    label: "Viewer",
    description:
      "Reads assigned forms and submission data without changing the workspace configuration.",
    permissions: [
      BACKEND_PERMISSIONS.projectForm.view,
      BACKEND_PERMISSIONS.submission.read,
      BACKEND_PERMISSIONS.storage.read,
      BACKEND_PERMISSIONS.storage.viewFile,
      BACKEND_PERMISSIONS.storage.viewFolder,
    ],
  },
} as const;

export type WorkspaceRoleBundleName = keyof typeof WORKSPACE_ROLE_BUNDLES;

export const WORKSPACE_ROLE_NAMES = Object.keys(
  WORKSPACE_ROLE_BUNDLES
) as WorkspaceRoleBundleName[];

export const getWorkspaceRoleBundle = (
  roleName?: string | null
): (typeof WORKSPACE_ROLE_BUNDLES)[WorkspaceRoleBundleName] | null => {
  if (!roleName) {
    return null;
  }

  if (roleName in WORKSPACE_ROLE_BUNDLES) {
    return WORKSPACE_ROLE_BUNDLES[roleName as WorkspaceRoleBundleName];
  }

  return null;
};

export const flattenWorkspaceRolePermissions = () =>
  Object.values(WORKSPACE_ROLE_BUNDLES).flatMap((bundle) => bundle.permissions);
