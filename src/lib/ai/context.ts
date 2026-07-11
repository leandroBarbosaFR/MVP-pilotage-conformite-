// Construit un contexte RÉSUMÉ à partir des données du tenant connecté.
// N'envoie jamais toute la base : seulement l'utile selon l'action demandée.
// Aucune donnée médicale détaillée n'est incluse.

import {
  getDashboardStats,
  getModulePriorities,
  getOverdueActions,
  getExpiredObligations,
  getUpcomingObligations,
  getExpiredDocuments,
  getOpenIncidents,
} from "@/lib/queries/dashboard";
import {
  getMissingDocumentObligations,
  getNonConformities,
  getProviders,
} from "@/lib/queries/entities";
import { formatDate } from "@/lib/utils";

/** Directive par défaut associée à chaque action rapide. */
export const ACTION_DIRECTIVES: Record<string, string> = {
  "missing-documents": "Résume les documents manquants et propose, pour chacun, qui relancer en priorité.",
  "critical-deadlines": "Explique les échéances critiques (dépassées et proches) et leur niveau d'urgence.",
  "prioritize-actions": "Priorise les actions en retard : lesquelles traiter en premier et pourquoi.",
  "follow-up-report": "Génère un compte rendu de suivi clair et structuré de l'état actuel.",
  "provider-reminder": "Prépare un texte de relance prestataire professionnel, court et clair.",
  "analyze-report": "Analyse le rapport de contrôle fourni : points importants, non-conformités détectées, actions correctives suggérées. Rappelle que l'analyse doit être vérifiée par un responsable compétent.",
  "summarize-nc": "Résume les non-conformités ouvertes (gravité, site, responsable, action liée, statut).",
  "first-actions": "Suggère les actions à traiter en premier, en distinguant faits et recommandations.",
  "direction-synthesis": "Crée une synthèse pour la direction : résumé court, points prioritaires, risques opérationnels, actions recommandées.",
  "meeting-summary": "Résume la réunion fournie : décisions, actions à créer, responsables, échéances, points bloquants, prochaine étape.",
};

function line(label: string, count: number) {
  return `- ${label} : ${count}`;
}

export async function buildAssistantContext(
  companyId: string,
  actionType?: string | null,
  pastedText?: string | null
): Promise<string> {
  // Snapshot global (toujours présent, pour ancrer les réponses)
  const stats = await getDashboardStats(companyId);
  const s = stats.stats;
  const priorities = await getModulePriorities(companyId, {
    missingDocs: s.missing_documents,
    overdueActions: stats.overdue_actions,
  });

  let ctx =
    `SYNTHÈSE GLOBALE\n` +
    `Obligations : ${s.obligations_total} au total (${s.obligations_ok} à jour, ${s.obligations_soon} à surveiller, ${s.obligations_expired} en retard).\n` +
    `Actions en retard : ${stats.overdue_actions}. Documents manquants : ${s.missing_documents}. Documents expirés : ${stats.expired_documents}.\n` +
    `PRIORITÉS PAR MODULE (éléments à traiter) :\n` +
    priorities.map((p) => line(p.label, p.count)).join("\n") +
    `\n`;

  // Détails selon l'action
  switch (actionType) {
    case "missing-documents": {
      const { rows } = await getMissingDocumentObligations(companyId, { pageSize: 30 });
      ctx += `\nDOCUMENTS MANQUANTS (${rows.length}) :\n` +
        rows.map((o) => `- ${o.expected_document ?? o.title} | module ${o.module} | échéance ${formatDate(o.due_date)} | statut ${o.status}`).join("\n");
      break;
    }
    case "critical-deadlines": {
      const [expired, upcoming] = await Promise.all([
        getExpiredObligations(companyId),
        getUpcomingObligations(companyId),
      ]);
      ctx += `\nOBLIGATIONS EN RETARD :\n` + expired.map((o) => `- ${o.title} | échéance ${formatDate(o.due_date)} | priorité ${o.priority}`).join("\n");
      ctx += `\nÉCHÉANCES PROCHES :\n` + upcoming.map((o) => `- ${o.title} | échéance ${formatDate(o.due_date)} | priorité ${o.priority}`).join("\n");
      break;
    }
    case "prioritize-actions":
    case "first-actions": {
      const overdue = await getOverdueActions(companyId);
      ctx += `\nACTIONS EN RETARD :\n` + overdue.map((a) => `- ${a.title} | échéance ${formatDate(a.due_date)} | priorité ${a.priority} | statut ${a.status}`).join("\n");
      break;
    }
    case "summarize-nc": {
      const { rows } = await getNonConformities(companyId, { status: "OPEN", pageSize: 30 });
      ctx += `\nNON-CONFORMITÉS OUVERTES (${rows.length}) :\n` +
        rows.map((n) => `- ${n.title} | gravité ${n.severity} | statut ${n.status} | échéance ${formatDate(n.due_date)}`).join("\n");
      break;
    }
    case "provider-reminder": {
      const { rows } = await getProviders(companyId, { followup: true, pageSize: 20 });
      ctx += `\nPRESTATAIRES À RELANCER (${rows.length}) :\n` +
        rows.map((p) => `- ${p.name} | type ${p.provider_type ?? "—"} | contact ${p.contact_name ?? "—"} | assurance ${formatDate(p.insurance_expiry)}`).join("\n");
      break;
    }
    case "direction-synthesis":
    case "follow-up-report": {
      const [expired, overdue, incidents] = await Promise.all([
        getExpiredObligations(companyId),
        getOverdueActions(companyId),
        getOpenIncidents(companyId),
      ]);
      ctx += `\nÉLÉMENTS CRITIQUES :\n` + expired.slice(0, 15).map((o) => `- ${o.title} (échéance ${formatDate(o.due_date)})`).join("\n");
      ctx += `\nACTIONS EN RETARD :\n` + overdue.slice(0, 15).map((a) => `- ${a.title} (échéance ${formatDate(a.due_date)})`).join("\n");
      ctx += `\nINCIDENTS NON CLÔTURÉS :\n` + incidents.map((i) => `- ${i.title} (${formatDate(i.occurred_at)})`).join("\n");
      break;
    }
    case "analyze-report":
    case "meeting-summary": {
      if (pastedText) ctx += `\nTEXTE FOURNI PAR L'UTILISATEUR :\n${pastedText.slice(0, 6000)}`;
      else ctx += `\n(Aucun texte fourni : demander à l'utilisateur de coller le contenu.)`;
      break;
    }
    default: {
      // Chat libre : le snapshot global suffit comme contexte.
      break;
    }
  }

  return ctx;
}
