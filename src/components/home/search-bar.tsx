"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { useHomeUiStore } from "@/stores/home-ui-store";

interface SearchBarProps {
  filterTrigger: React.ReactNode;
  className?: string;
}

export function SearchBar({ filterTrigger, className }: SearchBarProps) {
  const setSearchQuery = useHomeUiStore((s) => s.setSearchQuery);
  const [localQuery, setLocalQuery] = useState("");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalQuery(e.target.value);
    },
    [],
  );

  return (
    <motion.div
      className={cn("flex gap-3", className)}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
    >
      <div className="search-glow relative flex flex-1 items-center rounded-xl border border-border/60 bg-card transition-shadow">
        <Search
          className="pointer-events-none absolute left-4 size-5 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={localQuery}
          onChange={handleChange}
          placeholder="Search your creations..."
          aria-label="Search your creations"
          className="h-12 border-0 bg-transparent pl-12 pr-4 text-base shadow-none focus-visible:ring-0 md:h-14 md:text-lg"
        />
      </div>
      {filterTrigger}
    </motion.div>
  );
}
