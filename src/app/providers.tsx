"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { NavigationProgress } from "@/components/layout/NavigationProgress";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
