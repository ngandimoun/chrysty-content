"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useOptionalAuth } from "@/components/providers/auth-provider";
import { useGreeting } from "@/hooks/use-greeting";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getFirstName } from "@/lib/user-display";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const auth = useOptionalAuth();
  const firstName = getFirstName(auth?.fullName, auth?.email);
  const greeting = useGreeting(firstName);
  const reducedMotion = useReducedMotion();
  const avatarUrl = auth?.avatarUrl;

  return (
    <motion.header
      className={cn("space-y-1", className)}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={
                  firstName
                    ? `${firstName}'s profile photo`
                    : "Your profile photo"
                }
                width={44}
                height={44}
                className="size-10 shrink-0 rounded-full object-cover md:size-11 lg:size-12"
                referrerPolicy="no-referrer"
                unoptimized
              />
            ) : null}
            <span>{greeting}</span>
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            What would you like to create today?
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          className="shrink-0 rounded-xl"
          render={<Link href="/profile" />}
        >
          Stats
        </Button>
      </div>
    </motion.header>
  );
}
