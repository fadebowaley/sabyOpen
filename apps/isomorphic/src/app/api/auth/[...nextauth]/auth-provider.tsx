'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}): React.ReactNode {
  return (
    <SessionProvider
      session={session}
      // Reduce session fetching since we handle token refresh manually
      refetchInterval={0} // Disable automatic refetching
      refetchOnWindowFocus={false} // Don't refetch when window gains focus
      refetchWhenOffline={false} // Don't refetch when coming back online
      // Add error handling for session fetching
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}
