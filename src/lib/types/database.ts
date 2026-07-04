// Types métier — reflètent le schéma Supabase (supabase/migrations/0001_init.sql)

export type UserRole = "ADMIN_COMPANY" | "SUPERVISOR" | "RESPONSIBLE" | "VIEWER";

export type ObligationCategory =
  | "vehicule"
  | "conducteur"
  | "equipement"
  | "site"
  | "document"
  | "audit"
  | "formation"
  | "autre";

export type ObligationFrequency =
  | "unique"
  | "mensuelle"
  | "trimestrielle"
  | "semestrielle"
  | "annuelle"
  | "personnalisee";

export type PriorityLevel = "faible" | "moyen" | "critique";

export type ObligationStatus = "a_jour" | "bientot_expire" | "expire" | "archive";

export type ActionStatus = "a_faire" | "en_cours" | "termine" | "en_retard" | "archive";

export type ImportStatus = "en_attente" | "traite" | "echoue";

/** Statut de conformité générique utilisé pour l'affichage (couleurs). */
export type ComplianceStatus = "ok" | "warn" | "danger" | "none";

export interface Company {
  id: string;
  name: string;
  sector: string | null;
  employee_count: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface ArchivableRow {
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle extends ArchivableRow {
  id: string;
  company_id: string;
  registration_number: string;
  vehicle_type: string | null;
  brand: string | null;
  model: string | null;
  service_date: string | null;
  status: string;
  responsible_id: string | null;
  supervisor_id: string | null;
}

export interface Employee extends ArchivableRow {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  responsible_id: string | null;
  supervisor_id: string | null;
}

export interface Equipment extends ArchivableRow {
  id: string;
  company_id: string;
  name: string;
  equipment_type: string | null;
  site: string | null;
  internal_reference: string | null;
  status: string;
  responsible_id: string | null;
  supervisor_id: string | null;
}

export interface Epi extends ArchivableRow {
  id: string;
  company_id: string;
  epi_type: string;
  internal_reference: string | null;
  assigned_employee_id: string | null;
  issue_date: string | null;
  renewal_date: string | null;
  status: string;
  responsible_id: string | null;
  supervisor_id: string | null;
}

export interface Obligation extends ArchivableRow {
  id: string;
  company_id: string;
  title: string;
  category: ObligationCategory;
  description: string | null;
  due_date: string | null;
  frequency: ObligationFrequency;
  priority: PriorityLevel;
  status: ObligationStatus;
  responsible_id: string | null;
  supervisor_id: string | null;
  linked_vehicle_id: string | null;
  linked_employee_id: string | null;
  linked_equipment_id: string | null;
  comments: string | null;
}

export interface DocumentRow extends ArchivableRow {
  id: string;
  company_id: string;
  title: string;
  document_type: string | null;
  file_url: string | null;
  file_path: string | null;
  expiration_date: string | null;
  status: string;
  obligation_id: string | null;
  vehicle_id: string | null;
  employee_id: string | null;
  equipment_id: string | null;
  epi_id: string | null;
  uploaded_by: string | null;
}

export interface ActionRow extends ArchivableRow {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  priority: PriorityLevel;
  due_date: string | null;
  responsible_id: string | null;
  supervisor_id: string | null;
  obligation_id: string | null;
  comment: string | null;
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string | null;
  title: string;
  message: string | null;
  type: string | null;
  obligation_id: string | null;
  action_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ImportRow {
  id: string;
  company_id: string;
  file_name: string;
  file_url: string | null;
  import_type: string;
  status: ImportStatus;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  error_log: unknown;
  uploaded_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string | null;
  user_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

export interface DashboardStats {
  stats: {
    obligations_ok: number;
    obligations_soon: number;
    obligations_expired: number;
    obligations_total: number;
    obligations_without_responsible: number;
    missing_documents: number;
  };
  overdue_actions: number;
  pending_notifications: number;
  expired_documents: number;
}
