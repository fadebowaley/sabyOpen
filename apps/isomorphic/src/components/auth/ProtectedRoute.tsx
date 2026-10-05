"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { rbacService } from "@/lib/services/rbac.service";
import { Loader } from "rizzui";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission, hasRole, isAuthenticated, user } = usePermissions();

  useEffect(() => {
    if (status === "loading") return;

    if (!isAuthenticated) {
      router.push("/auth/sign-in");
      return;
    }

    // Check permissions
    if (requiredPermissions.length > 0 && !hasPermission(requiredPermissions)) {
      const fallbackUrl =
        redirectTo || rbacService.getUnauthorizedRedirectUrl(true);
      router.push(fallbackUrl);
      return;
    }

    // Check roles
    if (
      requiredRoles.length > 0 &&
      !requiredRoles.some((role) => hasRole(role))
    ) {
      const fallbackUrl =
        redirectTo || rbacService.getUnauthorizedRedirectUrl(true);
      router.push(fallbackUrl);
      return;
    }
  }, [
    status,
    isAuthenticated,
    hasPermission,
    hasRole,
    requiredPermissions,
    requiredRoles,
  ]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}


