"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Copy,
  Download,
  Heart,
  Info,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  fetchCreationManifest,
  patchCreationViaApi,
  postConsumptionEventsViaApi,
} from "@/lib/content/api-client";
import { cn } from "@/lib/utils";
import type { Creation } from "@/types/creation";

import { READER_PORTAL_SURFACE, getReaderPortalStyle, useConsumptionStore } from "./use-consumption-store";

interface ViewerOptionsMenuProps {
  creation: Creation;
  immersive?: boolean;
}

export function ViewerOptionsMenu({
  creation,
  immersive = false,
}: ViewerOptionsMenuProps) {
  const auth = useOptionalAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { readerTheme } = useConsumptionStore();
  const portalStyle = immersive ? getReaderPortalStyle(readerTheme) : undefined;
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(creation.title);
  const [busy, setBusy] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["creations"] });
    void queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const emit = async (
    eventType: "share" | "download" | "archive",
    payload?: Record<string, unknown>,
  ) => {
    await postConsumptionEventsViaApi(
      creation.id,
      [{ eventType, payload }],
      auth?.getAuthHeaders(),
    );
  };

  const toggleFavorite = async () => {
    try {
      await patchCreationViaApi(
        creation.id,
        { isFavorite: !creation.isFavorite },
        auth?.getAuthHeaders(),
      );
      invalidate();
      toast.success(
        creation.isFavorite ? "Removed from favorites" : "Added to favorites",
      );
    } catch {
      toast.error("Could not update favorite");
    }
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/creations/${creation.id}`;
    try {
      await navigator.clipboard.writeText(url);
      await emit("share", { url });
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const downloadExport = async () => {
    try {
      const manifest = await fetchCreationManifest(creation.id);
      const blob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${creation.title.replace(/\s+/g, "-").toLowerCase()}-manifest.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      await emit("download", { format: "manifest_json" });
      toast.success("Export downloaded");
    } catch {
      toast.error("Could not export");
    }
  };

  const renameCreation = async () => {
    const title = titleDraft.trim();
    if (!title) return;
    setBusy(true);
    try {
      await patchCreationViaApi(
        creation.id,
        { title },
        auth?.getAuthHeaders(),
      );
      invalidate();
      setRenameOpen(false);
      toast.success("Renamed");
      router.refresh();
    } catch {
      toast.error("Could not rename");
    } finally {
      setBusy(false);
    }
  };

  const duplicateCreation = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/creations/${creation.id}/duplicate`, {
        method: "POST",
        headers: auth?.getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Duplicate failed");
      const copy = (await res.json()) as Creation;
      invalidate();
      toast.success("Duplicated");
      router.push(`/creations/${copy.id}`);
    } catch {
      toast.error("Could not duplicate");
    } finally {
      setBusy(false);
    }
  };

  const archiveCreation = async () => {
    setBusy(true);
    try {
      await patchCreationViaApi(
        creation.id,
        { archived: true },
        auth?.getAuthHeaders(),
      );
      await emit("archive");
      invalidate();
      toast.success("Archived");
      router.push("/");
    } catch {
      toast.error("Could not archive");
    } finally {
      setBusy(false);
      setArchiveOpen(false);
    }
  };

  const deleteCreation = async () => {
    await archiveCreation();
    toast.success("Deleted", { description: "Moved to archive." });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-xl",
                immersive &&
                  "text-[var(--reader-fg)] hover:bg-[var(--reader-surface)]",
              )}
              aria-label="More options"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn("w-52", immersive && READER_PORTAL_SURFACE)}
          style={portalStyle}
        >
          <DropdownMenuItem onClick={() => void toggleFavorite()}>
            <Heart className="size-4" />
            {creation.isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setTitleDraft(creation.title);
              setRenameOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void duplicateCreation()}>
            <Copy className="size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void shareLink()}>
            <Share2 className="size-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void downloadExport()}>
            <Download className="size-4" />
            Download / Export
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setInfoOpen(true)}>
            <Info className="size-4" />
            Information
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
            <Archive className="size-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => void deleteCreation()}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(immersive && READER_PORTAL_SURFACE)}
          style={portalStyle}
        >
          <DialogHeader>
            <DialogTitle>Rename creation</DialogTitle>
          </DialogHeader>
          <Input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            aria-label="Title"
          />
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void renameCreation()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent
          className={cn(immersive && READER_PORTAL_SURFACE)}
          style={portalStyle}
        >
          <DialogHeader>
            <DialogTitle>{creation.title}</DialogTitle>
            <DialogDescription>{creation.description ?? creation.excerpt}</DialogDescription>
          </DialogHeader>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{creation.type}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{creation.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(creation.createdAt).toLocaleDateString()}</dd>
            </div>
            {creation.pageCount ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Pages</dt>
                <dd>{creation.pageCount}</dd>
              </div>
            ) : null}
            {creation.durationMinutes ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Duration</dt>
                <dd>{creation.durationMinutes} min</dd>
              </div>
            ) : null}
          </dl>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent
          showCloseButton={false}
          className={cn(immersive && READER_PORTAL_SURFACE)}
          style={portalStyle}
        >
          <DialogHeader>
            <DialogTitle>Archive this creation?</DialogTitle>
            <DialogDescription>
              &ldquo;{creation.title}&rdquo; will be hidden from your library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setArchiveOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void archiveCreation()}>
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
