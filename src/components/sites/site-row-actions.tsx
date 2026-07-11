"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  PencilSimpleIcon,
  ArchiveIcon,
  ArrowCounterClockwiseIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { RowMenu, MenuItem } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/app/modal";
import { SubmitButton } from "@/components/app/add-panel";
import { SiteFields } from "@/components/sites/site-fields";
import { toggleArchive, deleteSite, updateSite } from "@/lib/actions/entities";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import type { Profile, Site } from "@/lib/types/database";

/** Menu d'actions par ligne : voir, modifier, archiver/restaurer, supprimer. */
export function SiteRowActions({ site, profiles }: { site: Site; profiles: Profile[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  const archived = site.is_archived;

  const doArchive = async () => {
    const ok = await confirm({
      title: archived ? "Restaurer le site" : "Archiver le site",
      message: archived
        ? "Il réapparaîtra dans les listes actives."
        : "Il sera retiré des listes actives (aucune suppression définitive).",
      confirmLabel: archived ? "Restaurer" : "Archiver",
    });
    if (!ok) return;
    start(async () => {
      try {
        await toggleArchive("sites", site.id, !archived);
        router.refresh();
        toast(archived ? "Site restauré" : "Site archivé");
      } catch {
        toast("Action impossible", "error");
      }
    });
  };

  const doDelete = async () => {
    const ok = await confirm({
      title: "Supprimer le site",
      message: "Cette action est irréversible.",
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteSite(site.id);
        router.refresh();
        toast("Site supprimé");
      } catch {
        toast("Suppression impossible : des éléments sont rattachés à ce site.", "error");
      }
    });
  };

  return (
    <>
      <RowMenu>
        {(close) => (
          <>
            <MenuItem href={`/dashboard/sites/${site.id}`} icon={<EyeIcon size={16} />}>
              Voir le détail
            </MenuItem>
            <MenuItem
              icon={<PencilSimpleIcon size={16} />}
              onClick={() => {
                close();
                setEditOpen(true);
              }}
            >
              Modifier
            </MenuItem>
            <MenuItem
              icon={
                archived ? <ArrowCounterClockwiseIcon size={16} /> : <ArchiveIcon size={16} />
              }
              disabled={pending}
              onClick={() => {
                close();
                doArchive();
              }}
            >
              {archived ? "Restaurer" : "Archiver"}
            </MenuItem>
            <MenuItem
              danger
              icon={<TrashIcon size={16} />}
              disabled={pending}
              onClick={() => {
                close();
                doDelete();
              }}
            >
              Supprimer
            </MenuItem>
          </>
        )}
      </RowMenu>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le site">
        <form action={updateSite} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={site.id} />
          <SiteFields profiles={profiles} site={site} />
          <div className="sm:col-span-2">
            <SubmitButton>Enregistrer les modifications</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
