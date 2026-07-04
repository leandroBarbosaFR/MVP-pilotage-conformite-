// =====================================================================
// Enums métier — alignés sur les enums Postgres (migration 0003)
// Valeurs en anglais côté base ; libellés français côté interface.
// =====================================================================

export enum UserRole {
  ADMIN = "ADMIN",
  QHSE_MANAGER = "QHSE_MANAGER",
  HR_MANAGER = "HR_MANAGER",
  MAINTENANCE_MANAGER = "MAINTENANCE_MANAGER",
  FLEET_MANAGER = "FLEET_MANAGER",
  OPERATIONS_MANAGER = "OPERATIONS_MANAGER",
  SUPERVISOR = "SUPERVISOR",
  USER = "USER",
}

export enum ActionStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  PLANNED = "PLANNED",
  WAITING = "WAITING",
  DONE = "DONE",
  LATE = "LATE",
  CANCELLED = "CANCELLED",
  ARCHIVED = "ARCHIVED",
}

export enum PriorityLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum ComplianceStatus {
  COMPLIANT = "COMPLIANT",
  TO_WATCH = "TO_WATCH",
  EXPIRING_SOON = "EXPIRING_SOON",
  EXPIRED = "EXPIRED",
  MISSING_DOCUMENT = "MISSING_DOCUMENT",
  LATE = "LATE",
  ARCHIVED = "ARCHIVED",
}

export enum NotificationType {
  DUE_SOON = "DUE_SOON",
  EXPIRED = "EXPIRED",
  MISSING_DOCUMENT = "MISSING_DOCUMENT",
  ACTION_ASSIGNED = "ACTION_ASSIGNED",
  ACTION_LATE = "ACTION_LATE",
  DOCUMENT_ADDED = "DOCUMENT_ADDED",
  COMMENT_ADDED = "COMMENT_ADDED",
  CONTROL_TO_PLAN = "CONTROL_TO_PLAN",
  SUPERVISOR_ALERT = "SUPERVISOR_ALERT",
}

// --- Libellés français -------------------------------------------------

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.QHSE_MANAGER]: "Responsable QHSE",
  [UserRole.HR_MANAGER]: "Responsable RH",
  [UserRole.MAINTENANCE_MANAGER]: "Responsable maintenance",
  [UserRole.FLEET_MANAGER]: "Responsable parc",
  [UserRole.OPERATIONS_MANAGER]: "Responsable exploitation",
  [UserRole.SUPERVISOR]: "Superviseur",
  [UserRole.USER]: "Utilisateur",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  [ActionStatus.TODO]: "À faire",
  [ActionStatus.IN_PROGRESS]: "En cours",
  [ActionStatus.PLANNED]: "Planifié",
  [ActionStatus.WAITING]: "En attente",
  [ActionStatus.DONE]: "Terminé",
  [ActionStatus.LATE]: "En retard",
  [ActionStatus.CANCELLED]: "Annulé",
  [ActionStatus.ARCHIVED]: "Archivé",
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  [PriorityLevel.LOW]: "Faible",
  [PriorityLevel.MEDIUM]: "Moyenne",
  [PriorityLevel.HIGH]: "Haute",
  [PriorityLevel.CRITICAL]: "Critique",
};

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  [ComplianceStatus.COMPLIANT]: "Conforme",
  [ComplianceStatus.TO_WATCH]: "À surveiller",
  [ComplianceStatus.EXPIRING_SOON]: "Bientôt expiré",
  [ComplianceStatus.EXPIRED]: "Expiré",
  [ComplianceStatus.MISSING_DOCUMENT]: "Document manquant",
  [ComplianceStatus.LATE]: "En retard",
  [ComplianceStatus.ARCHIVED]: "Archivé",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.DUE_SOON]: "Échéance proche",
  [NotificationType.EXPIRED]: "Expiré",
  [NotificationType.MISSING_DOCUMENT]: "Document manquant",
  [NotificationType.ACTION_ASSIGNED]: "Action assignée",
  [NotificationType.ACTION_LATE]: "Action en retard",
  [NotificationType.DOCUMENT_ADDED]: "Document ajouté",
  [NotificationType.COMMENT_ADDED]: "Commentaire ajouté",
  [NotificationType.CONTROL_TO_PLAN]: "Contrôle à planifier",
  [NotificationType.SUPERVISOR_ALERT]: "Alerte superviseur",
};

// --- Correspondance statut de conformité -> couleur d'affichage --------

export type UiTone = "ok" | "warn" | "danger" | "none";

export const COMPLIANCE_TONE: Record<ComplianceStatus, UiTone> = {
  [ComplianceStatus.COMPLIANT]: "ok",
  [ComplianceStatus.TO_WATCH]: "warn",
  [ComplianceStatus.EXPIRING_SOON]: "warn",
  [ComplianceStatus.EXPIRED]: "danger",
  [ComplianceStatus.MISSING_DOCUMENT]: "warn",
  [ComplianceStatus.LATE]: "danger",
  [ComplianceStatus.ARCHIVED]: "none",
};

export const PRIORITY_TONE: Record<PriorityLevel, UiTone> = {
  [PriorityLevel.LOW]: "none",
  [PriorityLevel.MEDIUM]: "warn",
  [PriorityLevel.HIGH]: "warn",
  [PriorityLevel.CRITICAL]: "danger",
};

export const ACTION_STATUS_TONE: Record<ActionStatus, UiTone> = {
  [ActionStatus.TODO]: "none",
  [ActionStatus.IN_PROGRESS]: "warn",
  [ActionStatus.PLANNED]: "warn",
  [ActionStatus.WAITING]: "warn",
  [ActionStatus.DONE]: "ok",
  [ActionStatus.LATE]: "danger",
  [ActionStatus.CANCELLED]: "none",
  [ActionStatus.ARCHIVED]: "none",
};
