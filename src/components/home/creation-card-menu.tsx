"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  Heart,
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
import type { Creation } from "@/types/creation";

interface CreationCardMenuProps {
  creation: Creation;
}

export function CreationCardMenu({ creation }: CreationCardMenuProps) {
  const auth = useOptionalAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(creation.title);
  const [busy, setBusy] = useState(false);

  const isArchived = creation.status === "archived";
  const headers = auth?.getAuthHeaders();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["creations"] });
    void queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const toggleFavorite = async () => {
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
  };

  const shareLink = async () => {
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
  };

  const duplicateCreation = async () => {
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };

  const renameCreation = async () => {
    const title = titleDraft.trim();
    if (!title) return;
    setBusy(true);
    try {
      await patchCreationViaApi(creation.id, { title }, headers);
      invalidate();
      setRenameOpen(false);
      toast.success("Renamed");
    } catch {
      toast.error("Could not rename");
    } finally {
      setBusy(false);
    }
  };

  const setArchived = async (archived: boolean) => {
    setBusy(true);
    try {
      await patchCreationViaApi(creation.id, { archived }, headers);
      if (archived) {
        await postConsumptionEventsViaApi(
          creation.id,
          [{ eventType: "archive" }],
          headers,
        );
      }
      invalidate();
      toast.success(archived ? "Archived" : "Restored from archive");
      if (archived) router.refresh();
    } catch {
      toast.error(archived ? "Could not archive" : "Could not restore");
    } finally {
      setBusy(false);
      setArchiveOpen(false);
    }
  };

  const deleteCreation = async () => {
    await setArchived(true);
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
              className="size-11 shrink-0"
              aria-label={`More options for ${creation.title}`}
            />
          }
        >
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
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
          <DropdownMenuItem onClick={() => void downloadExport()}>
            <Download className="size-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void shareLink()}>
            <Share2 className="size-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isArchived ? (
            <DropdownMenuItem onClick={() => void setArchived(false)}>
              <ArchiveRestore className="size-4" />
              Unarchive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
              <Archive className="size-4" />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => void deleteCreation()}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
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

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Archive this creation?</DialogTitle>
            <DialogDescription>
              &ldquo;{creation.title}&rdquo; will be hidden from your main
              library.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setArchiveOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void setArchived(true)}>
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
