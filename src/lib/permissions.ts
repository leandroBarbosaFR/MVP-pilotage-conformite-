// =====================================================================
// Permissions applicatives par rôle.
// La RLS Supabase reste la barrière de sécurité ; ces helpers pilotent
// l'affichage (sidebar, boutons) et les garde-fous côté serveur.
// =====================================================================

import type { UserRole } from "@/lib/types/database";

export type AppModule =
  | "dashboard"
  | "personnel"
  | "epi"
  | "equipments"
  | "vehicles"
  | "sites"
  | "controls"
  | "documents"
  | "actions"
  | "alerts"
  | "providers"
  | "contracts"
  | "audits"
  | "incidents"
  | "non_conformities"
  | "imports"
  | "archives"
  | "reports"
  | "settings";

export type AppEntity =
  | "employees"
  | "certifications"
  | "absences"
  | "epi"
  | "equipments"
  | "vehicles"
  | "obligations"
  | "documents"
  | "actions"
  | "incidents";

const ALL = "all" as const;

/** Modules visibles dans la sidebar par rôle. */
const MODULE_ACCESS: Record<UserRole, AppModule[] | typeof ALL> = {
  ADMIN: ALL,
  QHSE_MANAGER: [
    "dashboard", "personnel", "epi", "equipments", "vehicles", "sites", "controls",
    "documents", "actions", "alerts", "providers", "contracts", "audits",
    "incidents", "non_conformities", "imports", "archives", "reports",
  ],
  HR_MANAGER: ["dashboard", "personnel", "documents", "actions", "alerts", "archives"],
  MAINTENANCE_MANAGER: ["dashboard", "equipments", "sites", "controls", "documents", "actions", "alerts", "providers", "incidents", "non_conformities", "archives"],
  FLEET_MANAGER: ["dashboard", "vehicles", "documents", "actions", "alerts", "providers", "contracts", "archives"],
  OPERATIONS_MANAGER: ["dashboard", "personnel", "equipments", "vehicles", "sites", "actions", "alerts", "contracts", "audits", "incidents", "non_conformities", "reports"],
  SUPERVISOR: ["dashboard", "actions", "alerts", "documents"],
  USER: ["dashboard", "actions", "alerts", "documents"],
};

/** Entités que le rôle peut créer / modifier / archiver. */
const WRITE_ENTITIES: Record<UserRole, AppEntity[] | typeof ALL> = {
  ADMIN: ALL,
  QHSE_MANAGER: ["obligations", "documents", "actions", "equipments", "epi", "certifications", "incidents"],
  HR_MANAGER: ["employees", "documents", "actions", "certifications", "absences"],
  MAINTENANCE_MANAGER: ["equipments", "obligations", "documents", "actions", "incidents"],
  FLEET_MANAGER: ["vehicles", "documents", "actions"],
  OPERATIONS_MANAGER: ["actions", "absences", "incidents"],
  SUPERVISOR: ["actions"],
  USER: ["actions", "documents"],
};

const MANAGER_ROLES: UserRole[] = [
  "ADMIN", "QHSE_MANAGER", "HR_MANAGER", "MAINTENANCE_MANAGER",
  "FLEET_MANAGER", "OPERATIONS_MANAGER",
];

export function canAccessModule(role: UserRole, module: AppModule): boolean {
  const allowed = MODULE_ACCESS[role];
  return allowed === ALL || allowed.includes(module);
}

export function canCreate(role: UserRole, entity: AppEntity): boolean {
  const allowed = WRITE_ENTITIES[role];
  if (allowed === ALL) return true;
  // SUPERVISOR ne crée pas (lecture / validation uniquement)
  if (role === "SUPERVISOR") return false;
  return allowed.includes(entity);
}

export function canUpdate(role: UserRole, entity: AppEntity): boolean {
  const allowed = WRITE_ENTITIES[role];
  return allowed === ALL || allowed.includes(entity);
}

export function canArchive(role: UserRole, entity: AppEntity): boolean {
  if (role === "ADMIN") return true;
  if (role === "SUPERVISOR" || role === "USER") return false;
  const allowed = WRITE_ENTITIES[role];
  return allowed === ALL || allowed.includes(entity);
}

export function canImport(role: UserRole): boolean {
  return role === "ADMIN" || role === "QHSE_MANAGER";
}

export function canExport(role: UserRole): boolean {
  return role === "ADMIN" || role === "QHSE_MANAGER" || role === "OPERATIONS_MANAGER";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

/** Voit toutes les données du tenant (par opposition à « seulement les miennes »). */
export function canViewAll(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role);
}

/** Ne voit que les éléments qui lui sont assignés / supervisés. */
export function canViewAssignedOnly(role: UserRole): boolean {
  return role === "USER" || role === "SUPERVISOR";
}
