import type {
  ActionStatus,
  ComplianceStatus,
  ObligationStatus,
} from "@/lib/types/database";
import { daysUntil } from "@/lib/utils";

/** Déduit le statut de conformité (couleur) à partir d'une date d'échéance. */
export function statusFromDate(date: string | null | undefined): ComplianceStatus {
  const d = daysUntil(date);
  if (d === null) return "none";
  if (d < 0) return "danger";
  if (d <= 30) return "warn";
  return "ok";
}

export function complianceFromObligationStatus(s: ObligationStatus): ComplianceStatus {
  switch (s) {
    case "a_jour":
      return "ok";
    case "bientot_expire":
      return "warn";
    case "expire":
      return "danger";
    default:
      return "none";
  }
}

export function complianceFromActionStatus(s: ActionStatus): ComplianceStatus {
  switch (s) {
    case "termine":
      return "ok";
    case "en_cours":
      return "warn";
    case "en_retard":
      return "danger";
    default:
      return "none";
  }
}

export const STATUS_LABELS: Record<ComplianceStatus, string> = {
  ok: "À jour",
  warn: "Bientôt expiré",
  danger: "Expiré / en retard",
  none: "Non renseigné",
};

export const OBLIGATION_STATUS_LABELS: Record<ObligationStatus, string> = {
  a_jour: "À jour",
  bientot_expire: "Bientôt expiré",
  expire: "Expiré",
  archive: "Archivé",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
  en_retard: "En retard",
  archive: "Archivé",
};

export const CATEGORY_LABELS: Record<string, string> = {
  vehicule: "Véhicule",
  conducteur: "Conducteur",
  equipement: "Équipement",
  site: "Site",
  document: "Document",
  audit: "Audit",
  formation: "Formation",
  autre: "Autre",
};

export const EPI_TYPES = [
  "Casque",
  "Harnais",
  "Chaussures de sécurité",
  "Détecteur de gaz",
  "Gants",
  "Lunettes",
  "Protections auditives",
  "Autre",
];

export const FREQUENCY_LABELS: Record<string, string> = {
  unique: "Unique",
  mensuelle: "Mensuelle",
  trimestrielle: "Trimestrielle",
  semestrielle: "Semestrielle",
  annuelle: "Annuelle",
  personnalisee: "Personnalisée",
};

export const PRIORITY_LABELS: Record<string, string> = {
  faible: "Faible",
  moyen: "Moyen",
  critique: "Critique",
};
