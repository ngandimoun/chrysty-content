"use client";

import { ChrystyLiveEmbedProvider } from "@chrysty/live-embed";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { ContentAppShell } from "@/components/layout/content-app-shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getQueryClient } from "@/lib/query-client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChrystyLiveEmbedProvider
            worker="content"
            astraEmbedUrl={
              process.env.NEXT_PUBLIC_ASTRA_EMBED_URL ??
              "https://chrysty.chrysty.dev"
            }
          >
            <ContentAppShell>{children}</ContentAppShell>
          </ChrystyLiveEmbedProvider>
          <Toaster richColors closeButton position="top-center" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
