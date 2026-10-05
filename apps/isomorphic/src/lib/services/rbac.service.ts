import rbacConfig from "@/config/rbac.config.json";
import redirectConfig from "@/config/redirect.config.json";
import permissionsConfig from "@/config/permissions.config.json";
import { normalizePermissionAlias } from "@/app/lib/access/backend-permissions";
import type {
  UserRole,
  RoutePermission,
  PermissionCheck,
} from "@/types/rbac.types";

export class RBACService {
  private static instance: RBACService;

  private constructor() {}

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  getUserOnboardingStatus(user: any):
    | "none"
    | "required"
    | "in_progress"
    | "complete"
    | null {
    if (!user || typeof user !== "object") return null;

    const explicitStatus = String(
      user.onboardingStatus || user.onboarding_state || ""
    )
      .trim()
      .toLowerCase();

    if (
      explicitStatus === "none" ||
      explicitStatus === "required" ||
      explicitStatus === "in_progress" ||
      explicitStatus === "complete"
    ) {
      return explicitStatus as
        | "none"
        | "required"
        | "in_progress"
        | "complete";
    }

    if (typeof user.requiresOnboarding === "boolean") {
      return user.requiresOnboarding ? "required" : "complete";
    }

    if (typeof user.onboardingComplete === "boolean") {
      return user.onboardingComplete ? "complete" : "required";
    }

    return null;
  }

  isOnboardingIncomplete(user: any): boolean {
    const status = this.getUserOnboardingStatus(user);
    return status === "required" || status === "in_progress";
  }

  /**
   * Check if route is public
   */
  isPublicRoute(pathname: string): boolean {
    return rbacConfig.publicRoutes.some((route) => {
      const regex = new RegExp(`^${route.replace(/\*/g, ".*")}$`);
      return regex.test(pathname);
    });
  }

  /**
   * Get route permissions
   */
  getRoutePermissions(pathname: string): RoutePermission | null {
    // Exact match first
    const exactMatch = (rbacConfig.routePermissions as any)[pathname];
    if (exactMatch) {
      return exactMatch as RoutePermission;
    }

    // Try pattern matching
    for (const [route, permissions] of Object.entries(
      rbacConfig.routePermissions
    )) {
      if (route.includes("*")) {
        const regex = new RegExp(`^${route.replace(/\*/g, ".*")}$`);
        if (regex.test(pathname)) {
          return permissions as RoutePermission;
        }
      }
    }

    return null;
  }

  /**
   * Check if user has required role
   */
  hasRequiredRole(userRoles: string[], requiredRoles: UserRole[]): boolean {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  /**
   * Normalize permission format (support both old and new during migration)
   * Old format: "action:resource" (e.g., "view:user")
   * New format: "resource:action" (e.g., "user:read")
   */
  private normalizePermission(permission: string): string {
    if (!permission || typeof permission !== "string") {
      return permission;
    }

    const aliasedPermission = normalizePermissionAlias(permission);

    // Special cases
    if (aliasedPermission === "*" || aliasedPermission === "all:*") {
      return "*";
    }

    // If already in new format (resource:action), return as-is
    if (
      aliasedPermission.match(
        /^[a-z]+[A-Z]?[a-z]*:(read|create|update|delete|manage|import|export|assign|restore|activate|deactivate|move|upload|download|share|copy|publish|archive|submit|process|complete|cancel|refund|regenerate|deleteAll|toggleStatus|assignRole|sendMessage|forgotPassword|resetPassword|verify|refresh|send|draft|retry|public|private|permissions|status|auth)$/
      )
    ) {
      return aliasedPermission;
    }

    // Fallback: Try to convert old format to new format
    const parts = aliasedPermission.split(":");
    if (parts.length >= 2) {
      const action = parts[0]; // e.g., 'view', 'create'
      const resourceParts = parts
        .slice(1)
        .filter((p) => p && !p.startsWith("::"));

      if (resourceParts.length > 0) {
        const resource = resourceParts[0];

        // Map old actions to new actions
        const actionMap: Record<string, string> = {
          view: "read",
          create: "create",
          update: "update",
          delete: "delete",
          manage: "manage",
          read: "read",
        };

        const newAction = actionMap[action] || action;
        return `${resource}:${newAction}`;
      }
    }

    // If we can't normalize, return as-is (might be already in correct format or special case)
    return aliasedPermission;
  }

  /**
   * Check if user has required permissions
   */
  hasRequiredPermissions(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    if (requiredPermissions.length === 0) return true;

    // Normalize user permissions (support both formats during migration)
    const normalizedUserPerms = userPermissions.map((perm) =>
      this.normalizePermission(perm)
    );
    const normalizedUserPermSet = new Set(normalizedUserPerms);
    const rawUserPermSet = new Set(
      userPermissions.map((perm) => normalizePermissionAlias(perm))
    );

    // Check for wildcard permission
    if (
      userPermissions.includes(permissionsConfig.specialPermissions.wildcard) ||
      normalizedUserPermSet.has("*")
    ) {
      return true;
    }

    // Check each required permission (support both formats)
    return requiredPermissions.every((requiredPerm) => {
      const normalizedRequired = this.normalizePermission(requiredPerm);
      // Check both original and normalized formats
      return (
        userPermissions.includes(requiredPerm) ||
        rawUserPermSet.has(normalizedRequired) ||
        normalizedUserPermSet.has(normalizedRequired)
      );
    });
  }

  /**
   * Check if user can access route
   */
  canAccessRoute(pathname: string, user: any): PermissionCheck {
    // Public routes are always accessible
    if (this.isPublicRoute(pathname)) {
      return { hasPermission: true, hasRole: true, isAuthorized: true };
    }

    // Get route permissions
    const routePermissions = this.getRoutePermissions(pathname);

    // If no specific permissions defined, require authentication only
    if (!routePermissions) {
      return {
        hasPermission: true,
        hasRole: true,
        isAuthorized: !!user,
        reason: user ? undefined : "Authentication required",
      };
    }

    if (!user) {
      return {
        hasPermission: false,
        hasRole: false,
        isAuthorized: false,
        reason: "Authentication required",
      };
    }

    const userRoleNames = this.getUserRoleNames(user);
    const userPermissionNames = this.getUserPermissionNames(user);
    const routeHasPermissionContract =
      Array.isArray(routePermissions.requiredPermissions) &&
      routePermissions.requiredPermissions.length > 0;
    const hasPermissionContract = routeHasPermissionContract
      ? this.hasRequiredPermissions(
          userPermissionNames,
          routePermissions.requiredPermissions
        )
      : true;

    // Check role requirements (skip if empty array)
    if (routePermissions.requiredRoles && routePermissions.requiredRoles.length > 0) {
      const hasRole = this.hasRequiredRole(
        userRoleNames,
        routePermissions.requiredRoles
      );

      if (!hasRole) {
        return {
          hasPermission: hasPermissionContract,
          hasRole: false,
          isAuthorized: false,
          reason: `Required roles: ${routePermissions.requiredRoles.join(", ")}`,
        };
      }
    }

    // Check permission requirements (skip if empty array)
    if (routePermissions.requiredPermissions && routePermissions.requiredPermissions.length > 0) {
      const hasPermission = hasPermissionContract;

      if (!hasPermission) {
        return {
          hasPermission: false,
          hasRole: true,
          isAuthorized: false,
          reason: `Required permissions: ${routePermissions.requiredPermissions.join(
            ", "
          )}`,
        };
      }
    }

    return { hasPermission: true, hasRole: true, isAuthorized: true };
  }

  /**
   * Get user role names
   */
  private getUserRoleNames(user: any): string[] {
    console.log('🔍 [RBAC] getUserRoleNames called with user flags:', {
      isSaby: user?.isSaby,
      isSuper: user?.isSuper,
      isOwner: user?.isOwner,
      isAdmin: user?.isAdmin,
      rolesArray: user?.roles
    });

    const roles: string[] = [];

    if (user.isSaby) {
      console.log('  ✅ Adding SabyUser role');
      roles.push("SabyUser");
    }
    if (user.isSuper) {
      console.log('  ✅ Adding SuperUser role');
      roles.push("SuperUser");
    }
    if (user.isOwner) {
      console.log('  ✅ Adding Owner role');
      roles.push("Owner");
    }
    if (user.isAdmin) {
      console.log('  ✅ Adding Admin role');
      roles.push("Admin");
    }

    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role: any) => {
        const roleName = typeof role === "string" ? role : role.name;
        if (roleName && !roles.includes(roleName)) {
          console.log('  ✅ Adding explicit role:', roleName);
          roles.push(roleName);
        }
      });
    }

    const finalRoles = roles.length > 0 ? roles : ["OrdinaryUser"];
    console.log('🔍 [RBAC] Final roles:', finalRoles);
    return finalRoles;
  }

  /**
   * Get user permission names
   */
  private getUserPermissionNames(user: any): string[] {
    const permissions: string[] = [];

    // SuperUser and SabyUser have wildcard permission (all permissions)
    if (user.isSuper || user.isSaby) {
      permissions.push(permissionsConfig.specialPermissions.wildcard);
      return permissions;
    }

    // Owner gets special resource bundle (using new format: resource:action)
    if (user.isOwner) {
      permissionsConfig.ownerResourceBundle.forEach((resource) => {
        permissions.push(`${resource}:read`);
        permissions.push(`${resource}:create`);
        permissions.push(`${resource}:update`);
        permissions.push(`${resource}:delete`);
        permissions.push(`${resource}:manage`);
      });
    }

    // isAdmin and Regular users get permissions from roles (sent from backend)
    if (user.isAdmin) {
      console.log('🔍 [RBAC] isAdmin user - permissions from backend:', user.permissions);
    }

    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach((perm: any) => {
        if (typeof perm === "string") {
          permissions.push(perm);
        } else if (perm.name) {
          permissions.push(perm.name);
        }
      });
    }

    if (user.isAdmin) {
      console.log('🔍 [RBAC] isAdmin final permissions:', permissions);
    }

    return permissions;
  }

  /**
   * Get redirect URL after login based on user role
   */
  getLoginRedirectUrl(user: any): string {
    console.log('🔍 [RBAC] getLoginRedirectUrl called with user:', {
      email: user?.email,
      isAdmin: user?.isAdmin,
      isOwner: user?.isOwner,
      isSuper: user?.isSuper,
      isSaby: user?.isSaby,
      roles: user?.roles
    });

    // Check channel restrictions
    const userRoleNames = this.getUserRoleNames(user);
    console.log('🔍 [RBAC] User role names:', userRoleNames);
    
    const allowedRoles = redirectConfig.channelRestrictions.web.allowedRoles;
    console.log('🔍 [RBAC] Allowed web roles:', allowedRoles);

    const hasAllowedLegacyRole = userRoleNames.some((role) =>
      allowedRoles.includes(role as UserRole)
    );
    const explicitRoles = Array.isArray(user?.roles)
      ? user.roles
          .map((role: any) => (typeof role === "string" ? role : role?.name))
          .filter(Boolean)
      : [];
    const explicitPermissions = this.getUserPermissionNames(user).filter(Boolean);
    const canAccessWeb =
      hasAllowedLegacyRole ||
      explicitRoles.length > 0 ||
      explicitPermissions.length > 0;
    console.log('🔍 [RBAC] Can access web:', canAccessWeb);

    if (!canAccessWeb) {
      console.log('❌ [RBAC] Access denied - redirecting to:', redirectConfig.channelRestrictions.web.deniedRedirect);
      return redirectConfig.channelRestrictions.web.deniedRedirect;
    }

    // Get role-based redirect
    if (user.isSaby) {
      console.log('✅ [RBAC] SabyUser redirect');
      return redirectConfig.loginRedirects.SabyUser;
    }
    if (user.isSuper) {
      console.log('✅ [RBAC] SuperUser redirect');
      return redirectConfig.loginRedirects.SuperUser;
    }
    if (user.isOwner) {
      console.log('✅ [RBAC] Owner redirect');
      return redirectConfig.loginRedirects.Owner;
    }
    if (user.isAdmin) {
      console.log('✅ [RBAC] Admin redirect');
      return redirectConfig.loginRedirects.Admin || redirectConfig.loginRedirects.default;
    }

    console.log('✅ [RBAC] Default redirect');
    return redirectConfig.loginRedirects.default;
  }

  /**
   * Get redirect URL for unauthorized access
   */
  getUnauthorizedRedirectUrl(isAuthenticated: boolean): string {
    return isAuthenticated
      ? redirectConfig.unauthorizedRedirects.authenticated
      : redirectConfig.unauthorizedRedirects.unauthenticated;
  }
}

export const rbacService = RBACService.getInstance();
