"use client";

import { USER_NAME } from "@/lib/constants";

export function useGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return `Good morning, ${USER_NAME}.`;
  if (hour < 17) return `Good afternoon, ${USER_NAME}.`;
  return `Good evening, ${USER_NAME}.`;
}
