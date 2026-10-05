"use client";

import { Loader, Text } from "rizzui";

interface AuthLoadingProps {
  message?: string;
}

export function AuthLoading({
  message = "Authenticating...",
}: AuthLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader variant="spinner" size="xl" className="mb-4" />
        <Text className="text-gray-600">{message}</Text>
      </div>
    </div>
  );
}


