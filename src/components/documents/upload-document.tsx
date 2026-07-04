"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createDocument } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";
import { FileInput, Input, Label } from "@/components/ui/input";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "documents";

export function UploadDocument({
  companyId,
  obligationId,
  vehicleId,
  employeeId,
  equipmentId,
  onDone,
}: {
  companyId: string;
  obligationId?: string;
  vehicleId?: string;
  employeeId?: string;
  equipmentId?: string;
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const documentType = String(data.get("document_type") ?? "").trim();
    const expiration = String(data.get("expiration_date") ?? "").trim();
    const file = data.get("file") as File | null;

    if (!title) {
      setMessage({ type: "error", text: "Le titre est obligatoire." });
      return;
    }
    if (!file || file.size === 0) {
      setMessage({ type: "error", text: "Veuillez sélectionner un fichier." });
      return;
    }

    start(async () => {
      try {
        const supabase = createClient();
        const path = `${companyId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
        if (uploadError) {
          setMessage({ type: "error", text: `Échec de l'envoi : ${uploadError.message}` });
          return;
        }
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60 * 24 * 365);

        await createDocument({
          title,
          document_type: documentType || null,
          expiration_date: expiration || null,
          file_path: path,
          file_url: signed?.signedUrl ?? null,
          obligation_id: obligationId ?? null,
          vehicle_id: vehicleId ?? null,
          employee_id: employeeId ?? null,
          equipment_id: equipmentId ?? null,
        });

        setMessage({ type: "ok", text: "Document ajouté." });
        formRef.current?.reset();
        onDone?.();
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Une erreur est survenue.",
        });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>Type de document</Label>
        <Input name="document_type" placeholder="Assurance, contrôle technique…" />
      </div>
      <div>
        <Label>Date d&apos;expiration</Label>
        <Input name="expiration_date" type="date" />
      </div>
      <div className="sm:col-span-2">
        <Label>Fichier</Label>
        <FileInput
          name="file"
          accept="image/*,application/pdf"
          capture="environment"
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Sur mobile, vous pouvez prendre une photo du document.
        </p>
      </div>
      {message ? (
        <p
          className={
            "sm:col-span-2 text-sm " +
            (message.type === "ok" ? "text-status-ok" : "text-status-danger")
          }
        >
          {message.text}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi en cours…" : "Enregistrer le document"}
        </Button>
      </div>
    </form>
  );
}
