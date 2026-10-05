'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BACKEND_PERMISSIONS,
  normalizePermissionAlias,
} from '@/app/lib/access/backend-permissions';
import {
  listProjectWorkspaces,
  type ProjectWorkspaceSummary,
  type WorkspaceRole,
} from '@/app/lib/api/projectForms';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useCurrentSubscriptionRuntime } from '@/app/lib/subscription/use-current-subscription';

const TEAM_MANAGER_FLAGS = ['isOwner', 'isAdmin', 'isSuper', 'isSaby'] as const;

const WRITE_WORKSPACE_ROLES: WorkspaceRole[] = ['owner', 'editor'];
const OWNER_ONLY_WORKSPACE_ROLES: WorkspaceRole[] = ['owner'];
const ALL_WORKSPACE_ROLES: WorkspaceRole[] = ['owner', 'editor', 'viewer'];

const normalizeWorkspaceId = (workspaceId?: string | null) =>
  String(workspaceId || '').trim();

export function useWorkspaceCapabilities() {
  const { user, hasPermission, canAccessRoute, isAuthenticated } = usePermissions();
  const subscriptionRuntime = useCurrentSubscriptionRuntime();
  const token = (user as any)?.accessToken as string | undefined;
  const [workspaces, setWorkspaces] = useState<ProjectWorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshWorkspaces = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setWorkspaces([]);
      return;
    }

    setLoading(true);
    try {
      const response = await listProjectWorkspaces(token);
      setWorkspaces(Array.isArray(response?.workspaces) ? response.workspaces : []);
    } catch (_error) {
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  const workspaceRoleMap = useMemo(() => {
    const map = new Map<string, WorkspaceRole>();
    workspaces.forEach((workspace) => {
      const workspaceId = normalizeWorkspaceId(workspace.workspaceId);
      if (workspaceId) {
        map.set(workspaceId, workspace.role);
      }
    });
    return map;
  }, [workspaces]);

  const hasWorkspaceRole = useCallback(
    (workspaceId: string | null | undefined, allowedRoles: WorkspaceRole[]) => {
      const normalizedWorkspaceId = normalizeWorkspaceId(workspaceId);
      if (!normalizedWorkspaceId) return false;
      const role = workspaceRoleMap.get(normalizedWorkspaceId);
      return role ? allowedRoles.includes(role) : false;
    },
    [workspaceRoleMap]
  );

  const hasAnyWorkspaceRole = useCallback(
    (allowedRoles: WorkspaceRole[]) =>
      workspaces.some((workspace) => allowedRoles.includes(workspace.role)),
    [workspaces]
  );

  const isWorkspaceTeamManager = useMemo(
    () => TEAM_MANAGER_FLAGS.some((flag) => Boolean((user as any)?.[flag])),
    [user]
  );

  const hasNormalizedPermission = useCallback(
    (permission: string) => hasPermission(normalizePermissionAlias(permission)),
    [hasPermission]
  );

  const canManageWorkspaceAssignments =
    isWorkspaceTeamManager && canAccessRoute('/studio/team');

  const canCreateWorkspaces =
    isWorkspaceTeamManager &&
    hasNormalizedPermission(BACKEND_PERMISSIONS.projectForm.create);

  const canInviteWorkspaceTeam = canManageWorkspaceAssignments;
  const canSeeWorkspaceTeam = canManageWorkspaceAssignments;

  const canCreateForms =
    hasNormalizedPermission(BACKEND_PERMISSIONS.projectForm.create) &&
    hasAnyWorkspaceRole(WRITE_WORKSPACE_ROLES);

  const canCreateFormsInWorkspace = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.projectForm.create) &&
      hasWorkspaceRole(workspaceId, WRITE_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canEditFormsInWorkspace = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.projectForm.update) &&
      hasWorkspaceRole(workspaceId, WRITE_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canPublishFormsInWorkspace = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.projectForm.update) &&
      hasWorkspaceRole(workspaceId, OWNER_ONLY_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canDeleteFormsInWorkspace = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.projectForm.delete) &&
      hasWorkspaceRole(workspaceId, OWNER_ONLY_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canManageWorkspaceSettings = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.projectForm.update) &&
      hasWorkspaceRole(workspaceId, OWNER_ONLY_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canViewWorkspaceData = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.submission.read) &&
      hasWorkspaceRole(workspaceId, ALL_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canEditWorkspaceData = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.submission.update) &&
      hasWorkspaceRole(workspaceId, ALL_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canDeleteWorkspaceData = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.submission.delete) &&
      hasWorkspaceRole(workspaceId, ALL_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canUseAdvancedExports =
    subscriptionRuntime.loading ||
    subscriptionRuntime.hasError ||
    subscriptionRuntime.hasCapability('advancedExports');

  const canExportWorkspaceData = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.export.read) &&
      hasWorkspaceRole(workspaceId, ALL_WORKSPACE_ROLES) &&
      canUseAdvancedExports,
    [canUseAdvancedExports, hasNormalizedPermission, hasWorkspaceRole]
  );

  const canViewWorkspaceReports = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.report.read) &&
      hasWorkspaceRole(workspaceId, ALL_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canViewWorkspaceVault = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.storage.read) &&
      hasWorkspaceRole(workspaceId, ALL_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  const canEditWorkspaceFiles = useCallback(
    (workspaceId?: string | null) =>
      hasNormalizedPermission(BACKEND_PERMISSIONS.storage.updateFile) &&
      hasWorkspaceRole(workspaceId, ALL_WORKSPACE_ROLES),
    [hasNormalizedPermission, hasWorkspaceRole]
  );

  return {
    loading,
    workspaces,
    refreshWorkspaces,
    hasWorkspaceRole,
    hasAnyWorkspaceRole,
    canSeeWorkspaceTeam,
    canManageWorkspaceAssignments,
    canCreateWorkspaces,
    canInviteWorkspaceTeam,
    canCreateForms,
    canCreateFormsInWorkspace,
    canEditFormsInWorkspace,
    canPublishFormsInWorkspace,
    canDeleteFormsInWorkspace,
    canManageWorkspaceSettings,
    canViewWorkspaceData,
    canEditWorkspaceData,
    canDeleteWorkspaceData,
    canExportWorkspaceData,
    canViewWorkspaceReports,
    canViewWorkspaceVault,
    canEditWorkspaceFiles,
  };
}
