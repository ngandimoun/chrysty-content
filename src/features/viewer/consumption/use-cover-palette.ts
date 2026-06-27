"use client";

import { useEffect, useState } from "react";
import { FastAverageColor } from "fast-average-color";

export function useCoverPalette(coverUrl?: string) {
  const [palette, setPalette] = useState<[string, string, string] | null>(null);

  useEffect(() => {
    if (!coverUrl) {
      setPalette(null);
      return;
    }

    let cancelled = false;
    const fac = new FastAverageColor();

    void fac
      .getColorAsync(coverUrl, { mode: "speed" })
      .then((color) => {
        if (cancelled) return;
        const hex = color.hex;
        setPalette([hex, color.isDark ? "#ffffff22" : "#00000011", `${hex}88`]);
      })
      .catch(() => {
        if (!cancelled) setPalette(null);
      });

    return () => {
      cancelled = true;
      fac.destroy();
    };
  }, [coverUrl]);

  return palette;
}
