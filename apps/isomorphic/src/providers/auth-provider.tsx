"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sessionManager } from "@/lib/services/session.service";
import { tokenService } from "@/lib/services/token.service";
import sessionConfig from "@/config/session.config.json";
import { toast } from "sonner";

function SessionMonitor({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session) {
      // Start session monitoring
      sessionManager.startSessionMonitoring(() => {
        setShowWarning(true);
        toast.error("Your session will expire soon. Please save your work.", {
          duration: sessionConfig.sessionTimeout.warningTime * 1000,
        });
      });

      // Check token expiry
      const checkTokenExpiry = setInterval(() => {
        const isExpired = tokenService.isTokenExpired(session.user.accessToken);

        if (isExpired && sessionConfig.security.logoutOnTokenExpiry) {
          console.warn("🔐 Token expired - forcing logout");
          sessionManager.forceLogout("Token expired");
        }
      }, 5000); // Check every 5 seconds

      return () => {
        clearInterval(checkTokenExpiry);
        sessionManager.stopSessionMonitoring();
      };
    }
  }, [status, session]);

  return <>{children}</>;
}

export default function EnhancedAuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={60}
      refetchOnWindowFocus>
      <SessionMonitor>{children}</SessionMonitor>
    </SessionProvider>
  );
}


