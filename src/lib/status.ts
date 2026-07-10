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
    case "COMPLIANT":
      return "ok";
    case "TO_WATCH":
    case "EXPIRING_SOON":
    case "MISSING_DOCUMENT":
      return "warn";
    case "EXPIRED":
    case "LATE":
      return "danger";
    default:
      return "none";
  }
}

export function complianceFromActionStatus(s: ActionStatus): ComplianceStatus {
  switch (s) {
    case "DONE":
      return "ok";
    case "IN_PROGRESS":
    case "PLANNED":
    case "WAITING":
      return "warn";
    case "LATE":
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
  COMPLIANT: "À jour",
  TO_WATCH: "À surveiller",
  EXPIRING_SOON: "Bientôt expiré",
  EXPIRED: "Expiré",
  MISSING_DOCUMENT: "Document manquant",
  LATE: "En retard",
  ARCHIVED: "Archivé",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  PLANNED: "Planifié",
  WAITING: "En attente",
  DONE: "Terminé",
  LATE: "En retard",
  CANCELLED: "Annulé",
  ARCHIVED: "Archivé",
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
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};
