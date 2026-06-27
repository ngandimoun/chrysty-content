"use client";

import { Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { ConsumptionMode } from "./consumption-mode";
import {
  getReaderPortalStyle,
  READER_PORTAL_SURFACE,
  READER_THEME_COLORS,
  READER_THEME_SWATCH,
  useConsumptionStore,
  type ReaderContentWidth,
  type ReaderFontSize,
  type ReaderTheme,
} from "./use-consumption-store";

interface ReaderSettingsMenuProps {
  mode?: ConsumptionMode;
  immersive?: boolean;
  hasTranscript?: boolean;
}

function SettingsDivider({
  borderColor,
}: {
  borderColor: string;
}) {
  return (
    <div
      className="h-px w-full shrink-0"
      style={{ backgroundColor: borderColor }}
      role="separator"
    />
  );
}

function SettingsLabel({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <p
      className="mb-2 text-xs font-semibold uppercase tracking-wider"
      style={{ color }}
    >
      {children}
    </p>
  );
}

export function ReaderSettingsMenu({
  mode = "book",
  immersive = false,
  hasTranscript = true,
}: ReaderSettingsMenuProps) {
  const {
    fontSize,
    lineHeight,
    readerTheme,
    contentWidth,
    highlightNarration,
    autoScroll,
    setFontSize,
    setLineHeight,
    setReaderTheme,
    setContentWidth,
    setHighlightNarration,
    setAutoScroll,
  } = useConsumptionStore();

  const themeColors = READER_THEME_COLORS[readerTheme];
  const portalStyle = getReaderPortalStyle(readerTheme);

  const themeLabels: Record<ReaderTheme, string> = {
    paper: "Paper",
    dark: "Dark",
    sepia: "Sepia",
    midnight: "Midnight",
  };

  const widthLabels: Record<ReaderContentWidth, string> = {
    narrow: "Narrow",
    comfortable: "Comfortable",
    wide: "Wide",
  };

  const outlineButtonStyle = immersive
    ? {
        borderColor: themeColors.border,
        backgroundColor: themeColors.surface,
        color: themeColors.fg,
      }
    : undefined;

  const labelColor = immersive ? themeColors.muted : undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            style={outlineButtonStyle}
            aria-label="Reader settings"
          >
            <Type className="size-4" />
          </Button>
        }
      />
      <PopoverContent
        className={cn(
          "z-[100] w-80 gap-0 overflow-hidden p-0 shadow-none",
          immersive && "border-0 bg-transparent ring-0",
        )}
        align="end"
        sideOffset={8}
      >
        <div
          className={cn(
            "rounded-lg border p-4 shadow-xl",
            immersive && READER_PORTAL_SURFACE,
          )}
          style={
            immersive
              ? {
                  ...portalStyle,
                  borderWidth: 1,
                  borderStyle: "solid",
                }
              : {
                  backgroundColor: "var(--popover)",
                  color: "var(--popover-foreground)",
                  borderColor: "var(--border)",
                }
          }
        >
          <div className="flex w-full flex-col gap-4">
            <h2 className="text-sm font-semibold">Reading settings</h2>

            {mode === "book" && (
              <>
                <div>
                  <SettingsLabel color={labelColor ?? "var(--muted-foreground)"}>
                    Width
                  </SettingsLabel>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      ["narrow", "comfortable", "wide"] as ReaderContentWidth[]
                    ).map((width) => (
                      <Button
                        key={width}
                        variant={contentWidth === width ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        style={
                          contentWidth !== width ? outlineButtonStyle : undefined
                        }
                        onClick={() => setContentWidth(width)}
                      >
                        {widthLabels[width]}
                      </Button>
                    ))}
                  </div>
                </div>

                <SettingsDivider
                  borderColor={
                    immersive ? themeColors.border : "var(--border)"
                  }
                />

                <div>
                  <SettingsLabel color={labelColor ?? "var(--muted-foreground)"}>
                    Theme
                  </SettingsLabel>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      ["paper", "dark", "sepia", "midnight"] as ReaderTheme[]
                    ).map((theme) => (
                      <Button
                        key={theme}
                        variant={readerTheme === theme ? "default" : "outline"}
                        size="sm"
                        className="flex items-center gap-2 text-xs"
                        style={
                          readerTheme !== theme ? outlineButtonStyle : undefined
                        }
                        onClick={() => setReaderTheme(theme)}
                      >
                        <span
                          className={cn(
                            "size-3 shrink-0 rounded-full border",
                            READER_THEME_SWATCH[theme],
                          )}
                          aria-hidden
                        />
                        {themeLabels[theme]}
                      </Button>
                    ))}
                  </div>
                </div>

                <SettingsDivider
                  borderColor={
                    immersive ? themeColors.border : "var(--border)"
                  }
                />
              </>
            )}

            <div>
              <SettingsLabel color={labelColor ?? "var(--muted-foreground)"}>
                Font
              </SettingsLabel>
              <div className="grid grid-cols-3 gap-1">
                {(["small", "medium", "large"] as ReaderFontSize[]).map((size) => (
                  <Button
                    key={size}
                    variant={fontSize === size ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                    style={fontSize !== size ? outlineButtonStyle : undefined}
                    onClick={() => setFontSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            <SettingsDivider
              borderColor={immersive ? themeColors.border : "var(--border)"}
            />

            <div>
              <SettingsLabel color={labelColor ?? "var(--muted-foreground)"}>
                Line height
              </SettingsLabel>
              <div className="grid grid-cols-3 gap-1">
                {(["normal", "relaxed", "loose"] as const).map((lh) => (
                  <Button
                    key={lh}
                    variant={lineHeight === lh ? "default" : "outline"}
                    size="sm"
                    className="capitalize"
                    style={lineHeight !== lh ? outlineButtonStyle : undefined}
                    onClick={() => setLineHeight(lh)}
                  >
                    {lh}
                  </Button>
                ))}
              </div>
            </div>

            <SettingsDivider
              borderColor={immersive ? themeColors.border : "var(--border)"}
            />

            {(mode === "book" || hasTranscript) && (
              <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                <span>Auto scroll</span>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="size-4 rounded border accent-primary"
                  style={
                    immersive
                      ? {
                          borderColor: themeColors.border,
                          backgroundColor: themeColors.bg,
                          accentColor: themeColors.accent,
                        }
                      : undefined
                  }
                />
              </label>
            )}

            {mode !== "book" && hasTranscript && (
              <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                <span>Highlight narration</span>
                <input
                  type="checkbox"
                  checked={highlightNarration}
                  onChange={(e) => setHighlightNarration(e.target.checked)}
                  className="size-4 rounded border border-border bg-background accent-primary"
                />
              </label>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
