import { NextResponse } from "next/server";
import { requireContext } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { getAiConfig, callChat, SYSTEM_PROMPT, type ChatMessage } from "@/lib/ai/config";
import { buildAssistantContext, ACTION_DIRECTIVES } from "@/lib/ai/context";

function isChatMessage(m: unknown): m is ChatMessage {
  const x = m as { role?: unknown; content?: unknown };
  return (x?.role === "user" || x?.role === "assistant") && typeof x?.content === "string";
}

export async function POST(request: Request) {
  let company: { id: string };
  let profile: { id: string };
  try {
    const ctx = await requireContext();
    company = ctx.company;
    profile = ctx.profile;
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    message?: unknown;
    action_type?: unknown;
    pasted_text?: unknown;
    history?: unknown;
  };

  const message = typeof body.message === "string" ? body.message : "";
  const actionType = typeof body.action_type === "string" ? body.action_type : null;
  const pastedText = typeof body.pasted_text === "string" ? body.pasted_text : null;
  const history: ChatMessage[] = Array.isArray(body.history) ? body.history.filter(isChatMessage).slice(-10) : [];

  const directive =
    message.trim() ||
    (actionType ? ACTION_DIRECTIVES[actionType] : "") ||
    "Fais une synthèse claire des priorités du moment.";

  const cfg = getAiConfig();
  if (!cfg.configured) {
    return NextResponse.json({
      configured: false,
      reply:
        "L'assistant IA n'est pas encore configuré. Ajoutez une clé API côté serveur (AI_API_KEY / AI_MODEL) pour l'activer.",
    });
  }

  let contextText = "";
  try {
    contextText = await buildAssistantContext(company.id, actionType, pastedText);
  } catch {
    contextText = "";
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `Données de l'espace entreprise (à utiliser exclusivement, ne rien inventer) :\n${contextText}` },
    ...history,
    { role: "user", content: directive },
  ];

  let reply = "";
  try {
    reply = await callChat(messages);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur de l'assistant IA." }, { status: 502 });
  }

  // Historique IA (best-effort, ne bloque pas la réponse)
  try {
    const supabase = await createClient();
    await supabase.from("ai_interactions").insert({
      company_id: company.id,
      user_id: profile.id,
      action_type: actionType,
      question: directive.slice(0, 2000),
      response: reply.slice(0, 8000),
    });
  } catch {
    /* ignore */
  }

  return NextResponse.json({ reply });
}
