export type UserRole = "SabyUser" | "SuperUser" | "Owner" | "Admin" | "OrdinaryUser";

export interface RoutePermission {
  requiredRoles: UserRole[];
  requiredPermissions: string[];
  requiresAuth: boolean;
  description?: string;
}

export interface RoutePermissions {
  [key: string]: RoutePermission;
}

export interface RBACConfig {
  version: string;
  routePermissions: RoutePermissions;
  publicRoutes: string[];
  roleHierarchy: Record<UserRole, number>;
}

export interface RedirectConfig {
  version: string;
  loginRedirects: Record<UserRole | "default", string>;
  unauthorizedRedirects: {
    authenticated: string;
    unauthenticated: string;
  };
  logoutRedirect: string;
  sessionExpiredRedirect: string;
  channelRestrictions: {
    web: {
      allowedRoles: UserRole[];
      deniedRedirect: string;
    };
  };
}

export interface SessionConfig {
  version: string;
  tokenRefresh: {
    enabled: boolean;
    refreshBeforeExpiry: number;
    maxRetries: number;
    retryDelay: number;
  };
  sessionTimeout: {
    enabled: boolean;
    warningTime: number;
    idleTimeout: number;
    absoluteTimeout: number;
  };
  security: {
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    enforceTokenExpiry: boolean;
    logoutOnTokenExpiry: boolean;
    clearSessionOnLogout: boolean;
  };
  activityTracking: {
    enabled: boolean;
    trackEvents: string[];
    debounceDelay: number;
  };
}

export interface PermissionsConfig {
  version: string;
  permissionGroups: Record<string, Record<string, string>>;
  specialPermissions: {
    wildcard: string;
    superAdmin: string;
  };
  ownerResourceBundle: string[];
}

export interface UserPermissions {
  roles: string[];
  permissions: string[];
  isOwner: boolean;
  isSuper: boolean;
  isAdmin: boolean;
  isSaby: boolean;
}

export interface PermissionCheck {
  hasPermission: boolean;
  hasRole: boolean;
  isAuthorized: boolean;
  reason?: string;
}


