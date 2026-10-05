"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface PermissionGateProps {
  children: ReactNode;
  permissions?: string | string[];
  roles?: string | string[];
  requireAll?: boolean; // If true, require all permissions/roles; if false, require any
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function PermissionGate({
  children,
  permissions,
  roles,
  requireAll = false,
  fallback = null,
  showFallback = false,
}: PermissionGateProps) {
  const { hasPermission, hasRole, hasAnyPermission, hasAnyRole, isLoading } =
    usePermissions();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  let hasAccess = true;

  // Check permissions
  if (permissions) {
    if (requireAll) {
      hasAccess = hasPermission(permissions);
    } else {
      const perms = Array.isArray(permissions) ? permissions : [permissions];
      hasAccess = hasAnyPermission(perms);
    }
  }

  // Check roles
  if (roles && hasAccess) {
    if (requireAll) {
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      hasAccess = requiredRoles.every((role) => hasRole(role));
    } else {
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      hasAccess = hasAnyRole(requiredRoles);
    }
  }

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}


