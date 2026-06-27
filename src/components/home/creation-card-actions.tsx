"use client";

import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Copy,
  Download,
  Heart,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  fetchCreationManifest,
  patchCreationViaApi,
  postConsumptionEventsViaApi,
} from "@/lib/content/api-client";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

interface CreationCardActionsProps {
  creation: Creation;
  className?: string;
}

const actions: {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  destructive?: boolean;
}[] = [
  { id: "favorite", label: "Favorite", icon: Heart },
  { id: "rename", label: "Rename", icon: Pencil },
  { id: "duplicate", label: "Duplicate", icon: Copy },
  { id: "download", label: "Download", icon: Download },
  { id: "share", label: "Share", icon: Share2 },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "delete", label: "Delete", icon: Trash2, destructive: true },
];

export function CreationCardActions({
  creation,
  className,
}: CreationCardActionsProps) {
  const auth = useOptionalAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["creations"] });
    void queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const handleAction = async (actionId: string) => {
    const headers = auth?.getAuthHeaders();

    if (actionId === "favorite") {
      try {
        await patchCreationViaApi(
          creation.id,
          { isFavorite: !creation.isFavorite },
          headers,
        );
        invalidate();
        toast.success(
          creation.isFavorite ? "Removed from favorites" : "Added to favorites",
        );
      } catch {
        toast.error("Could not update favorite");
      }
      return;
    }

    if (actionId === "share") {
      const url = `${window.location.origin}/creations/${creation.id}`;
      try {
        await navigator.clipboard.writeText(url);
        await postConsumptionEventsViaApi(
          creation.id,
          [{ eventType: "share", payload: { url } }],
          headers,
        );
        toast.success("Link copied");
      } catch {
        toast.error("Could not share");
      }
      return;
    }

    if (actionId === "download") {
      try {
        const manifest = await fetchCreationManifest(creation.id);
        const blob = new Blob([JSON.stringify(manifest, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${creation.title.replace(/\s+/g, "-").toLowerCase()}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        await postConsumptionEventsViaApi(
          creation.id,
          [{ eventType: "download", payload: { format: "manifest_json" } }],
          headers,
        );
        toast.success("Downloaded");
      } catch {
        toast.error("Could not download");
      }
      return;
    }

    if (actionId === "duplicate") {
      try {
        const res = await fetch(`/api/creations/${creation.id}/duplicate`, {
          method: "POST",
          headers,
        });
        if (!res.ok) throw new Error("failed");
        const copy = (await res.json()) as Creation;
        invalidate();
        toast.success("Duplicated");
        router.push(`/creations/${copy.id}`);
      } catch {
        toast.error("Could not duplicate");
      }
      return;
    }

    if (actionId === "archive" || actionId === "delete") {
      try {
        await patchCreationViaApi(creation.id, { archived: true }, headers);
        await postConsumptionEventsViaApi(
          creation.id,
          [{ eventType: "archive" }],
          headers,
        );
        invalidate();
        toast.success(actionId === "delete" ? "Deleted" : "Archived");
      } catch {
        toast.error("Could not update");
      }
      return;
    }

    if (actionId === "rename") {
      const next = window.prompt("Rename creation", creation.title);
      if (!next?.trim()) return;
      try {
        await patchCreationViaApi(
          creation.id,
          { title: next.trim() },
          headers,
        );
        invalidate();
        toast.success("Renamed");
      } catch {
        toast.error("Could not rename");
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg bg-card/95 p-1 shadow-card backdrop-blur-sm",
        className,
      )}
      role="toolbar"
      aria-label={`Actions for ${creation.title}`}
    >
      {actions.map(({ id, label, icon: Icon, destructive }) => (
        <Button
          key={id}
          variant="ghost"
          size="icon-sm"
          className={cn(
            "size-8",
            destructive && "text-destructive hover:text-destructive",
            id === "favorite" &&
              creation.isFavorite &&
              "text-rose-500 hover:text-rose-500",
          )}
          onClick={(e) => {
            e.stopPropagation();
            void handleAction(id);
          }}
          aria-label={label}
        >
          <Icon
            className={cn(
              "size-3.5",
              id === "favorite" && creation.isFavorite && "fill-current",
            )}
          />
        </Button>
      ))}
    </div>
  );
}
