"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { normalizePermissionAlias } from "@/app/lib/access/backend-permissions";
import { rbacService } from "@/lib/services/rbac.service";
import permissionsConfig from "@/config/permissions.config.json";

export function usePermissions() {
  const { data: session, status } = useSession();
  const user = session?.user as any; // Type assertion for extended user properties

  const permissions = useMemo(() => {
    if (!user) return [];

    const perms: string[] = [];

    // SuperUser and SabyUser have all permissions
    if (user.isSuper || user.isSaby) {
      return [permissionsConfig.specialPermissions.wildcard];
    }

    // Owner gets resource bundle (using new format: resource:action)
    if (user.isOwner) {
      permissionsConfig.ownerResourceBundle.forEach((resource) => {
        const permissionGroups = permissionsConfig.permissionGroups as Record<string, Record<string, string>>;
        // Try to find matching permission group (handle both exact match and variations)
        const groupKey = Object.keys(permissionGroups).find(
          (key) => key === resource || key === `${resource}s` || key === resource.toLowerCase()
        );
        
        if (groupKey && permissionGroups[groupKey]) {
          // Use permission group if found
          Object.values(permissionGroups[groupKey]).forEach((perm) => {
            const normalizedPerm = normalizePermissionAlias(perm);
            if (normalizedPerm && !perms.includes(normalizedPerm)) {
              perms.push(normalizedPerm);
            }
          });
        } else {
          // If no permission group found, generate standard CRUD permissions
          [
            `${resource}:read`,
            `${resource}:create`,
            `${resource}:update`,
            `${resource}:delete`,
            `${resource}:manage`,
          ].forEach((perm) => {
            const normalizedPerm = normalizePermissionAlias(perm);
            if (normalizedPerm && !perms.includes(normalizedPerm)) {
              perms.push(normalizedPerm);
            }
          });
        }
      });
    }

    // Add user's explicit permissions
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach((perm: any) => {
        const permName = typeof perm === "string" ? perm : perm.name;
        const normalizedPerm = normalizePermissionAlias(permName);
        if (normalizedPerm && !perms.includes(normalizedPerm)) {
          perms.push(normalizedPerm);
        }
      });
    }

    return perms;
  }, [user]);

  const roles = useMemo(() => {
    if (!user) return [];

    const userRoles: string[] = [];

    if (user.isSaby) userRoles.push("SabyUser");
    if (user.isSuper) userRoles.push("SuperUser");
    if (user.isOwner) userRoles.push("Owner");
    if (user.isAdmin) userRoles.push("Admin");

    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role: any) => {
        const roleName = typeof role === "string" ? role : role.name;
        if (roleName && !userRoles.includes(roleName)) {
          userRoles.push(roleName);
        }
      });
    }

    return userRoles.length > 0 ? userRoles : ["OrdinaryUser"];
  }, [user]);

  const hasPermission = (permission: string | string[]): boolean => {
    if (!user) return false;

    const requiredPerms = Array.isArray(permission) ? permission : [permission];
    const normalizedRequiredPerms = requiredPerms.map((perm) =>
      normalizePermissionAlias(perm)
    );

    // Check for wildcard permission (SuperUser and SabyUser have this)
    if (permissions.includes(permissionsConfig.specialPermissions.wildcard)) {
      return true;
    }

    return normalizedRequiredPerms.every((perm) => permissions.includes(perm));
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;

    const requiredRoles = Array.isArray(role) ? role : [role];
    return requiredRoles.some((r) => roles.includes(r));
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (!user) return false;

    // Check for wildcard permission (SuperUser and SabyUser have this)
    if (permissions.includes(permissionsConfig.specialPermissions.wildcard)) {
      return true;
    }

    return perms
      .map((perm) => normalizePermissionAlias(perm))
      .some((perm) => permissions.includes(perm));
  };

  const hasAnyRole = (requiredRoles: string[]): boolean => {
    if (!user) return false;

    return requiredRoles.some((role) => roles.includes(role));
  };

  const canAccessRoute = (pathname: string): boolean => {
    const check = rbacService.canAccessRoute(pathname, user);
    return check.isAuthorized;
  };

  return {
    permissions,
    roles,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAnyRole,
    canAccessRoute,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user,
  };
}
