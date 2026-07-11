"use client";

import { useEffect, useRef, useState } from "react";
import { PaperPlaneRightIcon, CopyIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS: { key: string; label: string; needsText?: boolean }[] = [
  { key: "missing-documents", label: "Résumer les documents manquants" },
  { key: "critical-deadlines", label: "Expliquer les échéances critiques" },
  { key: "prioritize-actions", label: "Prioriser les actions en retard" },
  { key: "follow-up-report", label: "Générer un compte rendu de suivi" },
  { key: "provider-reminder", label: "Préparer une relance prestataire" },
  { key: "summarize-nc", label: "Résumer les non-conformités" },
  { key: "first-actions", label: "Suggérer les actions à traiter en premier" },
  { key: "direction-synthesis", label: "Créer une synthèse pour la direction" },
  { key: "analyze-report", label: "Analyser un rapport de contrôle", needsText: true },
  { key: "meeting-summary", label: "Résumer une réunion", needsText: true },
];

export function AssistantChat({ initialAction }: { initialAction?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pasted, setPasted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // Lance automatiquement l'action passée en paramètre (bouton IA d'un module).
  useEffect(() => {
    if (startedRef.current || !initialAction) return;
    const a = QUICK_ACTIONS.find((x) => x.key === initialAction);
    if (!a || a.needsText) return;
    startedRef.current = true;
    send({ action_type: a.key, userLabel: a.label });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction]);

  async function send(payload: { message?: string; action_type?: string; userLabel: string }) {
    setError(null);
    const history = messages.slice(-10);
    const userMsg: Msg = { role: "user", content: payload.userLabel };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payload.message ?? "",
          action_type: payload.action_type ?? null,
          pasted_text: pasted || null,
          history,
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
      }
    } catch {
      setError("Impossible de contacter l'assistant. Réessayez.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    }
  }

  function onQuickAction(a: (typeof QUICK_ACTIONS)[number]) {
    if (loading) return;
    if (a.needsText && !pasted.trim()) {
      setError("Collez d'abord le texte du rapport ou de la réunion ci-dessous.");
      return;
    }
    send({ action_type: a.key, userLabel: a.label });
  }

  function onSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    send({ message: text, userLabel: text });
  }

  return (
    <div className="space-y-4">
      {/* Actions rapides */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            disabled={loading}
            onClick={() => onQuickAction(a)}
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <SparkleIcon size={16} className="shrink-0 text-accent" />
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Zone de texte à coller (rapport / réunion) */}
      <details className="rounded-md border border-border bg-surface">
        <summary className="cursor-pointer px-3 py-2 text-sm text-foreground">
          Coller un rapport de contrôle ou un compte rendu de réunion (pour « Analyser » / « Résumer une réunion »)
        </summary>
        <div className="border-t border-border p-3">
          <Textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={5}
            placeholder="Collez ici le texte du rapport ou de la réunion…"
          />
        </div>
      </details>

      {/* Conversation */}
      <div ref={scrollRef} className="max-h-[28rem] space-y-3 overflow-y-auto rounded-md border border-border bg-background p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Posez une question ou utilisez une action rapide. L&apos;assistant s&apos;appuie uniquement sur les données de votre espace.
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-md border px-3 py-2 text-sm",
                  m.role === "user" ? "border-accent/40 bg-accent/10 text-foreground" : "border-border bg-surface text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.role === "assistant" ? (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(m.content)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <CopyIcon size={12} /> Copier
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
        {loading ? <p className="text-sm text-muted-foreground">L&apos;assistant réfléchit…</p> : null}
        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
      </div>

      {/* Saisie */}
      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={2}
          placeholder="Posez une question sur vos échéances, documents, actions, véhicules, équipements, personnel, prestataires ou non-conformités…"
          className="flex-1"
        />
        <Button onClick={onSend} disabled={loading || !input.trim()}>
          <PaperPlaneRightIcon size={16} />
          Envoyer
        </Button>
      </div>
    </div>
  );
}
