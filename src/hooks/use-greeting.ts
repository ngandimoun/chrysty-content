"use client";

import { useEffect, useState } from "react";

function buildGreeting(firstName?: string | null): string {
  const hour = new Date().getHours();
  const period =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (firstName) {
    return `${period}, ${firstName}.`;
  }

  return `${period}.`;
}

function greetingPlaceholder(firstName?: string | null): string {
  if (firstName) {
    return `Good evening, ${firstName}.`;
  }

  return "Good evening.";
}

export function useGreeting(firstName?: string | null): string {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(buildGreeting(firstName));
  }, [firstName]);

  return greeting ?? greetingPlaceholder(firstName);
}
