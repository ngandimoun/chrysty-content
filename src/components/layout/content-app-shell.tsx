"use client";

import {
  AskChrystyButton,
  ChrystyHostContext,
} from "@chrysty/live-embed";
import { usePathname } from "next/navigation";

import { AuthGuard } from "@/components/auth/auth-guard";

type ContentAppShellProps = {
  children: React.ReactNode;
};

export function ContentAppShell({ children }: ContentAppShellProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/auth/")) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <ChrystyHostContext
        source="content_workspace"
        title="Content"
        captureTarget="#workspace-content"
        worker="content"
        entityId={pathname ?? "/"}
      >
        <main id="workspace-content" data-chrysty-capture>
          {children}
        </main>
        <AskChrystyButton />
      </ChrystyHostContext>
    </AuthGuard>
  );
}
