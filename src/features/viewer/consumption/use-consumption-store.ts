"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReaderTheme = "paper" | "dark" | "sepia" | "midnight";
export type ReaderFontSize = "small" | "medium" | "large";
export type ReaderContentWidth = "narrow" | "comfortable" | "wide";

interface ConsumptionStore {
  activeSectionIndex: number;
  setActiveSectionIndex: (index: number) => void;
  fontSize: ReaderFontSize;
  lineHeight: "normal" | "relaxed" | "loose";
  readerTheme: ReaderTheme;
  contentWidth: ReaderContentWidth;
  highlightNarration: boolean;
  autoScroll: boolean;
  sectionDrawerOpen: boolean;
  setFontSize: (size: ReaderFontSize) => void;
  setLineHeight: (height: "normal" | "relaxed" | "loose") => void;
  setReaderTheme: (theme: ReaderTheme) => void;
  setContentWidth: (width: ReaderContentWidth) => void;
  setHighlightNarration: (value: boolean) => void;
  setAutoScroll: (value: boolean) => void;
  setSectionDrawerOpen: (open: boolean) => void;
}

function migrateReaderTheme(theme: unknown): ReaderTheme {
  if (theme === "light") return "paper";
  if (
    theme === "paper" ||
    theme === "dark" ||
    theme === "sepia" ||
    theme === "midnight"
  ) {
    return theme;
  }
  return "paper";
}

export const useConsumptionStore = create<ConsumptionStore>()(
  persist(
    (set) => ({
      activeSectionIndex: 0,
      setActiveSectionIndex: (index) => set({ activeSectionIndex: index }),
      fontSize: "medium",
      lineHeight: "relaxed",
      readerTheme: "paper",
      contentWidth: "comfortable",
      highlightNarration: true,
      autoScroll: false,
      sectionDrawerOpen: false,
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setReaderTheme: (readerTheme) => set({ readerTheme }),
      setContentWidth: (contentWidth) => set({ contentWidth }),
      setHighlightNarration: (highlightNarration) => set({ highlightNarration }),
      setAutoScroll: (autoScroll) => set({ autoScroll }),
      setSectionDrawerOpen: (sectionDrawerOpen) => set({ sectionDrawerOpen }),
    }),
    {
      name: "chrysty-reader-prefs",
      partialize: (state) => ({
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        readerTheme: state.readerTheme,
        contentWidth: state.contentWidth,
        highlightNarration: state.highlightNarration,
        autoScroll: state.autoScroll,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ConsumptionStore> | undefined;
        return {
          ...current,
          ...p,
          readerTheme: migrateReaderTheme(p?.readerTheme),
          contentWidth: p?.contentWidth ?? "comfortable",
        };
      },
    },
  ),
);

export const READER_FONT_CLASS: Record<ReaderFontSize, string> = {
  small: "text-sm md:text-base",
  medium: "text-base md:text-lg",
  large: "text-lg md:text-xl",
};

export const READER_LINE_CLASS: Record<
  ConsumptionStore["lineHeight"],
  string
> = {
  normal: "reader-leading-normal",
  relaxed: "reader-leading-relaxed",
  loose: "reader-leading-loose",
};

export const READER_WIDTH_CLASS: Record<ReaderContentWidth, string> = {
  narrow: "max-w-[42.5rem]",
  comfortable: "max-w-[45rem]",
  wide: "max-w-[47.5rem]",
};

export const READER_THEME_CLASS: Record<ReaderTheme, string> = {
  paper: "reader-theme-paper",
  dark: "reader-theme-dark",
  sepia: "reader-theme-sepia",
  midnight: "reader-theme-midnight",
};

export const READER_THEME_SWATCH: Record<ReaderTheme, string> = {
  paper: "bg-[#F5F0E8] border-[#DDD5C8]",
  dark: "bg-[#1C1C1E] border-[#3A3A3C]",
  sepia: "bg-[#F4ECD8] border-[#D9CDB8]",
  midnight: "bg-[#0A0E14] border-[#1E2836]",
};

export const READER_THEME_COLORS: Record<
  ReaderTheme,
  {
    bg: string;
    fg: string;
    muted: string;
    border: string;
    surface: string;
    accent: string;
  }
> = {
  paper: {
    bg: "#f5f0e8",
    fg: "#2c2417",
    muted: "#5c4b37",
    border: "#ddd5c8",
    surface: "#faf6ef",
    accent: "#8b6914",
  },
  dark: {
    bg: "#1c1c1e",
    fg: "#e8e6e3",
    muted: "#b0aeab",
    border: "#3a3a3c",
    surface: "#2c2c2e",
    accent: "#a8a6a3",
  },
  sepia: {
    bg: "#f4ecd8",
    fg: "#5c4b37",
    muted: "#6b5340",
    border: "#d9cdb8",
    surface: "#faf3e4",
    accent: "#9a7b4f",
  },
  midnight: {
    bg: "#0a0e14",
    fg: "#c8d0dc",
    muted: "#9aa4b4",
    border: "#1e2836",
    surface: "#121820",
    accent: "#5b8def",
  },
};

export function getReaderPortalStyle(theme: ReaderTheme) {
  const colors = READER_THEME_COLORS[theme];
  return {
    backgroundColor: colors.surface,
    color: colors.fg,
    borderColor: colors.border,
  };
}

/** Opaque surface for portaled panels (popover, sheet, dialog). */
export const READER_PORTAL_SURFACE = "reader-portal-surface";
