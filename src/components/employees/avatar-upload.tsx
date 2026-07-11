"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateEmployeeAvatar } from "@/lib/actions/entities";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "documents";

export function AvatarUpload({
  employeeId,
  name,
  current,
}: {
  employeeId: string;
  name: string;
  current: string | null;
}) {
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<string | null>(current);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    start(async () => {
      try {
        const supabase = createClient();
        const path = `${employeeId}/avatar_${Date.now()}_${file.name}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
        if (upErr) {
          setError("Échec de l'envoi de la photo.");
          return;
        }
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
        const url = signed?.signedUrl ?? null;
        await updateEmployeeAvatar(employeeId, url);
        setPreview(url);
        router.refresh();
        toast("Photo mise à jour");
      } catch {
        setError("Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={preview} name={name} size={64} />
      <div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        <Button variant="outline" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
          {pending ? "Envoi…" : preview ? "Changer la photo" : "Ajouter une photo"}
        </Button>
        {error ? <p className="mt-1 text-xs text-status-danger">{error}</p> : null}
        <p className="mt-1 text-xs text-muted-foreground">Sur mobile, vous pouvez prendre une photo.</p>
      </div>
    </div>
  );
}
