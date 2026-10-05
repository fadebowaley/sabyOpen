// components/ClientProviders.tsx
"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@haloform/hooks/use-theme";
import { TooltipProvider } from "@haloform/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@haloform/ui/toaster";
import { Toaster as Sonner } from "@haloform/ui/sonner";

const queryClient = new QueryClient();

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
