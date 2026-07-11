// Types métier — reflètent le schéma Supabase (supabase/migrations/0001_init.sql)

export type UserRole =
  | "ADMIN"
  | "QHSE_MANAGER"
  | "HR_MANAGER"
  | "MAINTENANCE_MANAGER"
  | "FLEET_MANAGER"
  | "OPERATIONS_MANAGER"
  | "SUPERVISOR"
  | "USER";

export type NotificationType =
  | "DUE_SOON"
  | "EXPIRED"
  | "MISSING_DOCUMENT"
  | "ACTION_ASSIGNED"
  | "ACTION_LATE"
  | "DOCUMENT_ADDED"
  | "COMMENT_ADDED"
  | "CONTROL_TO_PLAN"
  | "SUPERVISOR_ALERT";

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

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Statut de conformité (ex-obligation_status), aligné sur l'enum compliance_status
export type ObligationStatus =
  | "COMPLIANT"
  | "TO_WATCH"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "MISSING_DOCUMENT"
  | "LATE"
  | "ARCHIVED";

export type ActionStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PLANNED"
  | "WAITING"
  | "DONE"
  | "LATE"
  | "CANCELLED"
  | "ARCHIVED";

export type ImportStatus = "en_attente" | "traite" | "echoue";

/** Statut de conformité générique utilisé pour l'affichage (couleurs). */
export type ComplianceStatus = "ok" | "warn" | "danger" | "none";

export interface Company {
  id: string;
  name: string;
  sector: string | null;
  employee_count: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string | null;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: UserRole;
  job_title: string | null;
  phone: string | null;
  is_active: boolean;
  avatar_url: string | null;
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
  site_id: string | null;
  main_driver_id: string | null;
  fleet_manager_id: string | null;
  insurance_expiry: string | null;
  technical_inspection_expiry: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  mileage: number | null;
  tachograph_expiry: string | null;
  extinguisher_expiry: string | null;
  priority: PriorityLevel | null;
  notes: string | null;
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
  job_family: string | null;
  service: string | null;
  site_id: string | null;
  contract_type: string | null;
  hire_date: string | null;
  contract_end_date: string | null;
  exit_date: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  avatar_url: string | null;
  responsible_id: string | null;
  supervisor_id: string | null;
}

export interface Equipment extends ArchivableRow {
  id: string;
  company_id: string;
  name: string;
  equipment_type: string | null;
  category: string | null;
  serial_number: string | null;
  site: string | null;
  site_id: string | null;
  internal_reference: string | null;
  last_check_date: string | null;
  next_check_date: string | null;
  frequency: string | null;
  provider_id: string | null;
  priority: PriorityLevel | null;
  notes: string | null;
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

export type ObligationModule =
  | "SITES"
  | "PERSONNEL"
  | "PPE"
  | "EQUIPMENT"
  | "VEHICLES"
  | "REGULATORY_CONTROLS"
  | "DOCUMENTS"
  | "CONTRACTS"
  | "AUDITS"
  | "NON_CONFORMITIES"
  | "ACTIONS";

export type RelatedEntityType =
  | "SITE"
  | "EMPLOYEE"
  | "DRIVER"
  | "PPE"
  | "EQUIPMENT"
  | "VEHICLE"
  | "DOCUMENT"
  | "CONTRACT"
  | "PROVIDER"
  | "AUDIT"
  | "NON_CONFORMITY"
  | "ACTION";

export interface Obligation extends ArchivableRow {
  id: string;
  company_id: string;
  title: string;
  category: ObligationCategory;
  module: ObligationModule;
  related_entity_type: RelatedEntityType | null;
  related_entity_id: string | null;
  provider_id: string | null;
  expected_document: string | null;
  expected_proof: string | null;
  description: string | null;
  notes: string | null;
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
  site_id: string | null;
  provider_id: string | null;
  contract_id: string | null;
  audit_id: string | null;
  incident_id: string | null;
  non_conformity_id: string | null;
  certification_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  responsible_id: string | null;
  supervisor_id: string | null;
  uploaded_by: string | null;
}

export interface ActionRow extends ArchivableRow {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  category: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  status: ActionStatus;
  priority: PriorityLevel;
  due_date: string | null;
  assigned_to: string | null;
  supervisor_id: string | null;
  obligation_id: string | null;
  source: string | null;
  expected_proof: string | null;
  comment: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string | null;
  archive_reason: string | null;
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string | null;
  title: string;
  message: string | null;
  type: NotificationType | null;
  priority: PriorityLevel | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  obligation_id: string | null;
  action_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export type ContractStatus = "ACTIVE" | "TO_RENEW" | "EXPIRED" | "TERMINATED" | "ARCHIVED";
export type AuditStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "LATE" | "CANCELLED" | "ARCHIVED";
export type AuditResult = "COMPLIANT" | "MINOR_NC" | "MAJOR_NC" | "CRITICAL" | "TO_REVIEW";
export type NcStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "VERIFIED" | "CLOSED" | "ARCHIVED";

export interface Site extends ArchivableRow {
  id: string;
  company_id: string;
  name: string;
  site_type: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  surface_area: number | null;
  activity_type: string | null;
  manager_id: string | null;
  supervisor_id: string | null;
  status: string;
  notes: string | null;
}

export interface Provider extends ArchivableRow {
  id: string;
  company_id: string;
  name: string;
  provider_type: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  address_complement: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  is_active: boolean;
  responsible_id: string | null;
  site_id: string | null;
  insurance_expiry: string | null;
  priority: PriorityLevel | null;
  needs_followup: boolean;
  last_reminded_at: string | null;
  reminder_count: number;
}

export interface Contract extends ArchivableRow {
  id: string;
  company_id: string;
  title: string;
  contract_type: string | null;
  provider_id: string | null;
  site_id: string | null;
  related_entity_type: RelatedEntityType | null;
  related_entity_id: string | null;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  notice_period_days: number | null;
  amount: number | null;
  currency: string | null;
  responsible_id: string | null;
  supervisor_id: string | null;
  status: ContractStatus;
  document_id: string | null;
  notes: string | null;
}

export interface Audit extends ArchivableRow {
  id: string;
  company_id: string;
  title: string;
  audit_type: string | null;
  site_id: string | null;
  auditor_name: string | null;
  provider_id: string | null;
  planned_date: string | null;
  completed_date: string | null;
  status: AuditStatus;
  result: AuditResult | null;
  score: number | null;
  responsible_id: string | null;
  supervisor_id: string | null;
  report_document_id: string | null;
  notes: string | null;
}

export interface NonPilotix extends ArchivableRow {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  severity: PriorityLevel;
  source_type: string | null;
  source_id: string | null;
  site_id: string | null;
  related_entity_type: RelatedEntityType | null;
  related_entity_id: string | null;
  detected_at: string | null;
  due_date: string | null;
  responsible_id: string | null;
  supervisor_id: string | null;
  status: NcStatus;
  corrective_action_id: string | null;
  document_id: string | null;
}

export type CertificationType =
  | "FORMATION"
  | "HABILITATION"
  | "MEDICAL_VISIT"
  | "LICENSE"
  | "PPE"
  | "AUTHORIZATION"
  | "APTITUDE"
  | "OTHER";

export type AptitudeStatus =
  | "FIT"
  | "FIT_WITH_RESTRICTIONS"
  | "TEMP_UNFIT"
  | "UNFIT";

export type IncidentType = "INCIDENT" | "NEAR_MISS" | "OBSERVATION";
export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "ARCHIVED";

export interface EmployeeCertification extends ArchivableRow {
  id: string;
  company_id: string;
  employee_id: string;
  type: CertificationType;
  category: string | null;
  title: string;
  obtained_date: string | null;
  expiry_date: string | null;
  status: ObligationStatus;
  priority: PriorityLevel;
  document_id: string | null;
  responsible_id: string | null;
  supervisor_id: string | null;
  notes: string | null;
}

export interface EmployeeAbsence extends ArchivableRow {
  id: string;
  company_id: string;
  employee_id: string;
  is_sick_leave: boolean;
  start_date: string | null;
  expected_end_date: string | null;
  return_date: string | null;
  work_status: string;
  aptitude: AptitudeStatus | null;
  restrictions: string | null;
  next_medical_visit: string | null;
  return_visit_required: boolean;
  document_id: string | null;
  responsible_id: string | null;
  internal_notes: string | null;
}

export interface Incident extends ArchivableRow {
  id: string;
  company_id: string;
  type: IncidentType;
  title: string;
  description: string | null;
  site_id: string | null;
  zone: string | null;
  occurred_at: string | null;
  severity: PriorityLevel;
  status: IncidentStatus;
  responsible_id: string | null;
  supervisor_id: string | null;
  related_entity_type: RelatedEntityType | null;
  related_entity_id: string | null;
  corrective_action_id: string | null;
  document_id: string | null;
}

export interface Reminder {
  id: string;
  company_id: string;
  module: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  title: string;
  person_to_remind: string | null;
  person_id: string | null;
  email: string | null;
  channel: string;
  status: string;
  reminded_at: string;
  next_reminder_at: string | null;
  comment: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  tenant_id: string;
  alert_days_before_due: number;
  notify_responsible: boolean;
  notify_supervisor: boolean;
  notify_admin: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
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
