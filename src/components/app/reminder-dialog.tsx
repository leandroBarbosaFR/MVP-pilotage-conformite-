"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRingingIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { createReminder } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { REMINDER_CHANNELS, REMINDER_CHANNEL_LABELS, REMINDER_STATUS_LABELS } from "@/types/enums";

export function ReminderDialog({
  label,
  module,
  relatedType,
  relatedId,
  providerId,
  people = [],
  defaultPersonName,
}: {
  label: string;
  module?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  providerId?: string | null;
  people?: { id: string; name: string }[];
  defaultPersonName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const [personId, setPersonId] = useState("");
  const [personName, setPersonName] = useState(defaultPersonName ?? "");
  const [channel, setChannel] = useState("interne");
  const [status, setStatus] = useState("ENVOYEE");
  const [comment, setComment] = useState("");

  function submit() {
    start(async () => {
      const selected = people.find((p) => p.id === personId);
      await createReminder({
        label,
        module: module ?? null,
        relatedType: relatedType ?? null,
        relatedId: relatedId ?? null,
        providerId: providerId ?? null,
        personId: personId || null,
        personName: selected?.name ?? (personName || null),
        channel,
        status,
        comment: comment || null,
      });
      setOpen(false);
      setComment("");
      router.refresh();
      toast("Relance enregistrée");
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BellRingingIcon size={14} />
        Relancer
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Créer une relance</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="text-muted-foreground hover:text-foreground">
                <XIcon size={18} />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Élément concerné : <span className="font-medium text-foreground">{label}</span>
            </p>
            <div className="space-y-3">
              <div>
                <Label>Personne à relancer</Label>
                {people.length > 0 ? (
                  <Select value={personId} onChange={(e) => setPersonId(e.target.value)}>
                    <option value="">Non précisé</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                ) : (
                  <Input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Nom du contact ou du prestataire" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Canal</Label>
                  <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                    {REMINDER_CHANNELS.map((c) => <option key={c} value={c}>{REMINDER_CHANNEL_LABELS[c]}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {Object.entries(REMINDER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Commentaire</Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Ex : Rapport demandé au prestataire incendie" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
              <Button size="sm" disabled={pending} onClick={submit}>
                {pending ? "Enregistrement…" : "Enregistrer la relance"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
