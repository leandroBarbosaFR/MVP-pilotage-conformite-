"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Modal, useModalClose } from "@/components/app/modal";

/**
 * Bouton "Ajouter" qui ouvre une modale centrée (fond flouté) contenant un
 * formulaire. La modale se ferme via la croix, la touche Échap, un clic sur
 * l'arrière-plan, ou automatiquement après un enregistrement réussi (voir
 * `SubmitButton`).
 */
export function AddPanel({
  label = "Ajouter",
  title,
  children,
}: {
  label?: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={16} /> {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        {children}
      </Modal>
    </>
  );
}

/**
 * Bouton de soumission à placer dans un formulaire de modale. Ferme la modale
 * et rafraîchit la liste dès que l'action serveur est terminée.
 */
export function SubmitButton({ children, disabled, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  const close = useModalClose();
  const router = useRouter();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      // La soumission vient de se terminer : on rafraîchit la liste et on ferme.
      router.refresh();
      close();
    }
    wasPending.current = pending;
  }, [pending, close, router]);

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? "Enregistrement…" : children}
    </Button>
  );
}
