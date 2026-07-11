import { requireContext } from "@/lib/queries/auth";
import { getAiConfig } from "@/lib/ai/config";
import { PageHeader } from "@/components/app/page-header";
import { AssistantChat } from "@/components/ai/assistant-chat";

export default async function AssistantIaPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const sp = await searchParams;
  await requireContext();
  const { configured } = getAiConfig();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Assistant IA"
        description="Analysez vos échéances, documents, actions et non-conformités à partir des données de votre entreprise."
      />

      <div className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
        L&apos;assistant IA s&apos;appuie uniquement sur les données de votre espace entreprise pour vous aider à résumer,
        prioriser et préparer vos actions. Il ne remplace pas l&apos;analyse humaine et ne constitue pas une garantie
        juridique de conformité. Les réponses doivent être vérifiées par un responsable compétent avant décision.
      </div>

      {!configured ? (
        <div className="rounded-md border border-status-warn/40 bg-status-warn/10 px-4 py-3 text-sm text-foreground">
          L&apos;assistant IA n&apos;est pas encore configuré. Ajoutez une clé API côté serveur
          (<code>AI_API_KEY</code>, <code>AI_MODEL</code>, éventuellement <code>AI_BASE_URL</code>) pour l&apos;activer.
          Les actions ci-dessous restent visibles mais renverront un message d&apos;information tant qu&apos;aucune clé
          n&apos;est configurée.
        </div>
      ) : null}

      <AssistantChat initialAction={sp.action} />
    </div>
  );
}
