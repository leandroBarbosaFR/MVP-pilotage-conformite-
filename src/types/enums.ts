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

export enum ObligationModule {
  SITES = "SITES",
  PERSONNEL = "PERSONNEL",
  PPE = "PPE",
  EQUIPMENT = "EQUIPMENT",
  VEHICLES = "VEHICLES",
  REGULATORY_CONTROLS = "REGULATORY_CONTROLS",
  DOCUMENTS = "DOCUMENTS",
  CONTRACTS = "CONTRACTS",
  AUDITS = "AUDITS",
  NON_CONFORMITIES = "NON_CONFORMITIES",
  ACTIONS = "ACTIONS",
}

export enum RelatedEntityType {
  SITE = "SITE",
  EMPLOYEE = "EMPLOYEE",
  DRIVER = "DRIVER",
  PPE = "PPE",
  EQUIPMENT = "EQUIPMENT",
  VEHICLE = "VEHICLE",
  DOCUMENT = "DOCUMENT",
  CONTRACT = "CONTRACT",
  PROVIDER = "PROVIDER",
  AUDIT = "AUDIT",
  NON_CONFORMITY = "NON_CONFORMITY",
  ACTION = "ACTION",
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

export const MODULE_LABELS: Record<ObligationModule, string> = {
  [ObligationModule.SITES]: "Sites et locaux",
  [ObligationModule.PERSONNEL]: "Personnel",
  [ObligationModule.PPE]: "EPI",
  [ObligationModule.EQUIPMENT]: "Machines et équipements",
  [ObligationModule.VEHICLES]: "Véhicules",
  [ObligationModule.REGULATORY_CONTROLS]: "Contrôles réglementaires",
  [ObligationModule.DOCUMENTS]: "Documents",
  [ObligationModule.CONTRACTS]: "Contrats",
  [ObligationModule.AUDITS]: "Audits et inspections",
  [ObligationModule.NON_CONFORMITIES]: "Non-conformités",
  [ObligationModule.ACTIONS]: "Actions",
};

/** Route de la page métier associée à un module (pour cliquer depuis le dashboard). */
export const MODULE_HREF: Record<ObligationModule, string> = {
  [ObligationModule.SITES]: "/dashboard/sites",
  [ObligationModule.PERSONNEL]: "/dashboard/employees",
  [ObligationModule.PPE]: "/dashboard/epi",
  [ObligationModule.EQUIPMENT]: "/dashboard/equipments",
  [ObligationModule.VEHICLES]: "/dashboard/vehicles",
  [ObligationModule.REGULATORY_CONTROLS]: "/dashboard/obligations",
  [ObligationModule.DOCUMENTS]: "/dashboard/documents",
  [ObligationModule.CONTRACTS]: "/dashboard/contracts",
  [ObligationModule.AUDITS]: "/dashboard/audits",
  [ObligationModule.NON_CONFORMITIES]: "/dashboard/non-conformities",
  [ObligationModule.ACTIONS]: "/dashboard/actions",
};

export const RELATED_ENTITY_LABELS: Record<RelatedEntityType, string> = {
  [RelatedEntityType.SITE]: "Site",
  [RelatedEntityType.EMPLOYEE]: "Salarié",
  [RelatedEntityType.DRIVER]: "Conducteur",
  [RelatedEntityType.PPE]: "EPI",
  [RelatedEntityType.EQUIPMENT]: "Équipement",
  [RelatedEntityType.VEHICLE]: "Véhicule",
  [RelatedEntityType.DOCUMENT]: "Document",
  [RelatedEntityType.CONTRACT]: "Contrat",
  [RelatedEntityType.PROVIDER]: "Prestataire",
  [RelatedEntityType.AUDIT]: "Audit",
  [RelatedEntityType.NON_CONFORMITY]: "Non-conformité",
  [RelatedEntityType.ACTION]: "Action",
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

// --- Modules métier (Prompt 2) : listes de types + libellés de statut ---

export const SITE_TYPES = [
  "Bureau", "Entrepôt", "Atelier", "Dépôt", "Agence", "Site de production",
  "Parking / zone extérieure", "Quai de chargement", "Local technique", "Autre",
];

export const PROVIDER_TYPES = [
  "Organisme de contrôle", "Maintenance extincteurs", "Maintenance alarme",
  "Maintenance électrique", "Maintenance gaz", "Maintenance machines",
  "Maintenance véhicules", "Garage", "Assurance", "Médecine du travail",
  "Organisme de formation", "Vérificateur levage", "Télésurveillance",
  "Dératisation", "Nettoyage", "Autre",
];

export const CONTRACT_TYPES = [
  "Assurance locaux", "Assurance véhicule", "Assurance multirisque",
  "Maintenance extincteurs", "Maintenance alarme", "Maintenance électrique",
  "Maintenance gaz", "Maintenance machines", "Maintenance véhicules",
  "Médecine du travail", "Organisme de formation", "Télésurveillance",
  "Bail commercial", "Nettoyage", "Dératisation", "Autre",
];

export const AUDIT_TYPES = [
  "Audit interne", "Audit client", "Audit sécurité", "Audit qualité", "Audit QHSE",
  "Inspection DREAL", "Inspection du travail", "Contrôle assurance",
  "Contrôle réglementaire", "Visite sécurité", "Autre",
];

export const NC_SOURCE_TYPES = [
  "Audit", "Inspection", "Contrôle", "Document", "Équipement", "Véhicule",
  "Salarié", "Site", "Manuel",
];

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  TO_RENEW: "À renouveler",
  EXPIRED: "Expiré",
  TERMINATED: "Résilié",
  ARCHIVED: "Archivé",
};
export const CONTRACT_STATUS_TONE: Record<string, UiTone> = {
  ACTIVE: "ok",
  TO_RENEW: "warn",
  EXPIRED: "danger",
  TERMINATED: "none",
  ARCHIVED: "none",
};

export const AUDIT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  LATE: "En retard",
  CANCELLED: "Annulé",
  ARCHIVED: "Archivé",
};
export const AUDIT_STATUS_TONE: Record<string, UiTone> = {
  PLANNED: "warn",
  IN_PROGRESS: "warn",
  DONE: "ok",
  LATE: "danger",
  CANCELLED: "none",
  ARCHIVED: "none",
};

export const AUDIT_RESULT_LABELS: Record<string, string> = {
  COMPLIANT: "Conforme",
  MINOR_NC: "Non-conformités mineures",
  MAJOR_NC: "Non-conformités majeures",
  CRITICAL: "Critique",
  TO_REVIEW: "À revoir",
};

export const NC_STATUS_LABELS: Record<string, string> = {
  OPEN: "Ouverte",
  IN_PROGRESS: "En cours",
  RESOLVED: "Corrigée",
  VERIFIED: "Vérifiée",
  CLOSED: "Fermée",
  ARCHIVED: "Archivée",
};
export const NC_STATUS_TONE: Record<string, UiTone> = {
  OPEN: "danger",
  IN_PROGRESS: "warn",
  RESOLVED: "warn",
  VERIFIED: "ok",
  CLOSED: "ok",
  ARCHIVED: "none",
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
