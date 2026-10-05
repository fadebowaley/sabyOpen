import {
  BACKEND_PERMISSIONS,
  normalizePermissionAlias,
} from "@/app/lib/access/backend-permissions";
import {
  WORKSPACE_OWNER_ROLE,
  WORKSPACE_DATA_ADMINISTRATOR_ROLE,
  WORKSPACE_EDITOR_ROLE,
  WORKSPACE_VIEWER_ROLE,
} from "@/app/lib/access/role-bundles";
import { getPermissions } from "@/app/lib/api/permissions";
import {
  assignRolePermissions,
  bulkCreateRoles,
  getPermissionsForRole,
  getRoles,
} from "@/app/lib/api/roles";
import { assignRoles } from "@/app/lib/api/users";
import type { WorkspaceRole } from "@/app/lib/api/projectForms";

type RoleRecord = {
  _id?: string;
  id?: string;
  name?: string;
  permissions?: Array<{ _id?: string; id?: string; name?: string } | string>;
};

type PermissionRecord = {
  _id?: string;
  id?: string;
  name?: string;
};

export type WorkspaceAccessProfileId =
  | "workspace_owner"
  | "data_administrator"
  | "editor"
  | "viewer";

type WorkspaceAccessProfile = {
  id: WorkspaceAccessProfileId;
  label: string;
  description: string;
  workspaceRole: WorkspaceRole;
  bundleRoleName: string | null;
  permissionNames: string[];
};

const WORKSPACE_ACCESS_PROFILES: Record<
  WorkspaceAccessProfileId,
  WorkspaceAccessProfile
> = {
  workspace_owner: {
    id: "workspace_owner",
    label: "Workspace Owner",
    description:
      "Acts as a co-owner within assigned workspaces for forms, data, reports, and vault operations.",
    workspaceRole: "owner",
    bundleRoleName: WORKSPACE_OWNER_ROLE,
    permissionNames: [
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
  data_administrator: {
    id: "data_administrator",
    label: "Data Administrator",
    description: "Can review, export, update, and manage workspace data.",
    workspaceRole: "viewer",
    bundleRoleName: WORKSPACE_DATA_ADMINISTRATOR_ROLE,
    permissionNames: [
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
  editor: {
    id: "editor",
    label: "Editor",
    description: "Can create and update forms inside assigned workspaces.",
    workspaceRole: "editor",
    bundleRoleName: WORKSPACE_EDITOR_ROLE,
    permissionNames: [
      BACKEND_PERMISSIONS.projectForm.view,
      BACKEND_PERMISSIONS.projectForm.create,
      BACKEND_PERMISSIONS.projectForm.update,
      BACKEND_PERMISSIONS.submission.read,
      BACKEND_PERMISSIONS.storage.read,
      BACKEND_PERMISSIONS.storage.viewFile,
      BACKEND_PERMISSIONS.storage.viewFolder,
    ],
  },
  viewer: {
    id: "viewer",
    label: "Viewer",
    description: "Can read forms and records in assigned workspaces.",
    workspaceRole: "viewer",
    bundleRoleName: WORKSPACE_VIEWER_ROLE,
    permissionNames: [
      BACKEND_PERMISSIONS.projectForm.view,
      BACKEND_PERMISSIONS.submission.read,
      BACKEND_PERMISSIONS.storage.read,
      BACKEND_PERMISSIONS.storage.viewFile,
      BACKEND_PERMISSIONS.storage.viewFolder,
    ],
  },
};

const getId = (value: { _id?: string; id?: string } | null | undefined) =>
  String(value?._id || value?.id || "").trim();

const normalizeRoleResults = (payload: any): RoleRecord[] => {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.roles)) return payload.roles;
  return [];
};

const normalizePermissionResults = (payload: any): PermissionRecord[] => {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.permissions)) return payload.permissions;
  return [];
};

const findRoleByName = (roles: RoleRecord[], roleName: string) =>
  roles.find(
    (role) =>
      String(role?.name || "").trim().toLowerCase() ===
      roleName.trim().toLowerCase()
  );

const ensureBundleRoles = async (token: string) => {
  let roleResults = normalizeRoleResults(await getRoles(token));

  const missingRoleSpecs = Object.values(WORKSPACE_ACCESS_PROFILES)
    .filter((profile) => profile.bundleRoleName)
    .filter(
      (profile) =>
        !findRoleByName(roleResults, profile.bundleRoleName as string)
    )
    .map((profile) => ({
      name: profile.bundleRoleName as string,
      description: profile.description,
    }));

  if (missingRoleSpecs.length > 0) {
    await bulkCreateRoles({ rolesArray: missingRoleSpecs }, token);
    roleResults = normalizeRoleResults(await getRoles(token));
  }

  return roleResults;
};

const ensureRolePermissions = async (
  role: RoleRecord,
  permissionMap: Map<string, string>,
  token: string,
  requiredPermissionNames: string[]
) => {
  const roleId = getId(role);
  if (!roleId || requiredPermissionNames.length === 0) {
    return;
  }

  const currentPermissionPayload = await getPermissionsForRole(roleId, token);
  const currentPermissions = normalizePermissionResults(currentPermissionPayload);
  const currentPermissionIds = new Set(
    currentPermissions.map((permission) => getId(permission)).filter(Boolean)
  );

  const requiredPermissionIds = requiredPermissionNames
    .map((permissionName) => normalizePermissionAlias(permissionName))
    .map((permissionName) => permissionMap.get(permissionName) || "")
    .filter(Boolean);

  const missingPermissionIds = requiredPermissionIds.filter(
    (permissionId) => !currentPermissionIds.has(permissionId)
  );

  if (missingPermissionIds.length > 0) {
    await assignRolePermissions(roleId, missingPermissionIds, token);
  }
};

export const listWorkspaceAccessProfiles = () =>
  Object.values(WORKSPACE_ACCESS_PROFILES);

export const getWorkspaceAccessProfile = (
  profileId: WorkspaceAccessProfileId
) => WORKSPACE_ACCESS_PROFILES[profileId];

export const provisionWorkspaceAccessProfile = async ({
  profileId,
  token,
  userId,
}: {
  profileId: WorkspaceAccessProfileId;
  token: string;
  userId: string;
}) => {
  const profile = getWorkspaceAccessProfile(profileId);

  if (!profile.bundleRoleName) {
    return {
      profile,
      assignedRoleId: null,
    };
  }

  const [rolesPayload, permissionsPayload] = await Promise.all([
    ensureBundleRoles(token),
    getPermissions({ limit: 1000 }, token),
  ]);

  const permissionMap = new Map<string, string>();
  normalizePermissionResults(permissionsPayload).forEach((permission) => {
    const permissionName = normalizePermissionAlias(permission?.name || "");
    const permissionId = getId(permission);
    if (permissionName && permissionId) {
      permissionMap.set(permissionName, permissionId);
    }
  });

  const missingPermissionNames = profile.permissionNames.filter(
    (permissionName) =>
      !permissionMap.has(normalizePermissionAlias(permissionName))
  );
  if (missingPermissionNames.length > 0) {
    throw new Error(
      `Missing platform permissions for ${profile.label}: ${missingPermissionNames.join(
        ", "
      )}`
    );
  }

  const role = findRoleByName(rolesPayload, profile.bundleRoleName);
  if (!role) {
    throw new Error(`Access role "${profile.bundleRoleName}" could not be resolved`);
  }

  await ensureRolePermissions(role, permissionMap, token, profile.permissionNames);

  const roleId = getId(role);
  if (!roleId) {
    throw new Error(`Access role "${profile.bundleRoleName}" has no identifier`);
  }

  await assignRoles(userId, [roleId], token);

  return {
    profile,
    assignedRoleId: roleId,
  };
};
