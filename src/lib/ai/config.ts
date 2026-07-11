// Configuration de l'assistant IA — SERVEUR UNIQUEMENT.
// La clé n'est jamais exposée côté client (utilisée seulement dans /api/assistant).
// Compatible avec toute API "chat completions" de type OpenAI (OpenAI, Vercel AI
// Gateway, etc.) via AI_BASE_URL.

export interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
  configured: boolean;
}

export function getAiConfig(): AiConfig {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const provider = process.env.AI_PROVIDER || "openai";
  return { apiKey, baseUrl, model, provider, configured: apiKey.length > 0 };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Appelle le fournisseur IA (côté serveur). Lève une erreur en cas d'échec. */
export async function callChat(messages: ChatMessage[]): Promise<string> {
  const { apiKey, baseUrl, model } = getAiConfig();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 900 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fournisseur IA (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

export const SYSTEM_PROMPT = `Tu es un assistant IA intégré à un logiciel de pilotage conformité opérationnelle. Tu aides les entreprises à résumer, prioriser et préparer le suivi de leurs obligations, échéances, documents, contrôles, véhicules, équipements, personnel, prestataires, contrats, audits, incidents, non-conformités et actions.

Tu ne fournis pas de conseil juridique.
Tu ne garantis pas la conformité.
Tu aides à organiser, synthétiser et prioriser les informations internes.

Réponds en français professionnel, de manière claire, concise et actionnable.
Si une information manque, indique-le.
Quand tu proposes des actions, distingue les faits observés des recommandations.
Ne jamais inventer de données absentes du contexte fourni.`;
