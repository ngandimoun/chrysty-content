"use client";

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

  return <AuthGuard>{children}</AuthGuard>;
}
