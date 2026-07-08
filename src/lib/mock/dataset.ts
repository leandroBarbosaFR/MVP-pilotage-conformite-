// Jeu de données de démonstration en mémoire (mode démo).
// Les tableaux sont mutables : les écritures de démo (créer/modifier) persistent
// pendant la durée de vie du process serveur.

import { DEMO_COMPANY_ID, DEMO_USER_ID } from "@/lib/demo";

function iso(daysOffset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}
const NOW = new Date().toISOString();

type Row = Record<string, unknown>;

const archivable = { is_archived: false, archived_at: null, archived_by: null, created_at: NOW, updated_at: NOW };

export const company: Row = {
  id: DEMO_COMPANY_ID,
  name: "TransPilot Demo",
  sector: "Transport / Logistique",
  employee_count: "100 à 250",
  created_at: NOW,
  updated_at: NOW,
};

// --- Profils (utilisateurs + membres invités) -------------------------
export const profiles: Row[] = [
  { id: "p-admin", user_id: DEMO_USER_ID, first_name: "Emma", last_name: "Admin", email: "emma.admin@transpilot-demo.fr", role: "ADMIN", job_title: "Direction", phone: "06 00 00 00 01", is_active: true },
  { id: "p-qhse", user_id: null, first_name: "Claire", last_name: "QHSE", email: "claire.qhse@transpilot-demo.fr", role: "QHSE_MANAGER", job_title: "Responsable QHSE", phone: "06 00 00 00 02", is_active: true },
  { id: "p-maint", user_id: null, first_name: "Marc", last_name: "Maintenance", email: "marc.maintenance@transpilot-demo.fr", role: "MAINTENANCE_MANAGER", job_title: "Responsable maintenance", phone: "06 00 00 00 03", is_active: true },
  { id: "p-rh", user_id: null, first_name: "Sophie", last_name: "RH", email: "sophie.rh@transpilot-demo.fr", role: "HR_MANAGER", job_title: "Responsable RH", phone: "06 00 00 00 04", is_active: true },
  { id: "p-parc", user_id: null, first_name: "Julien", last_name: "Parc", email: "julien.parc@transpilot-demo.fr", role: "FLEET_MANAGER", job_title: "Responsable parc", phone: "06 00 00 00 05", is_active: true },
  { id: "p-expl", user_id: null, first_name: "Nadia", last_name: "Exploitation", email: "nadia.exploitation@transpilot-demo.fr", role: "OPERATIONS_MANAGER", job_title: "Responsable exploitation", phone: "06 00 00 00 06", is_active: true },
  { id: "p-sup", user_id: null, first_name: "Paul", last_name: "Superviseur", email: "paul.superviseur@transpilot-demo.fr", role: "SUPERVISOR", job_title: "Superviseur", phone: "06 00 00 00 07", is_active: true },
  { id: "p-user", user_id: null, first_name: "Utilisateur", last_name: "Démo", email: "user.demo@transpilot-demo.fr", role: "USER", job_title: "Opérateur", phone: "06 00 00 00 08", is_active: false },
].map((p) => ({ ...p, company_id: DEMO_COMPANY_ID, created_at: NOW, updated_at: NOW }));

const C = DEMO_COMPANY_ID;

// --- Salariés ----------------------------------------------------------
const EMP_FIRST = ["Marc", "Julie", "Karim", "Sophie", "Paul", "Nadia", "Éric", "Lucas"];
const EMP_LAST = ["Durand", "Petit", "Benali", "Moreau", "Girard", "Haddad", "Lefevre", "Roy"];
const EMP_JOB = ["Conducteur PL", "Conductrice PL", "Cariste", "Exploitation", "Conducteur SPL", "Magasinier", "Conducteur PL", "Mécanicien"];
const EMP_FAMILY = ["Conducteur", "Conducteur", "Cariste", "Exploitation", "Conducteur", "Cariste", "Conducteur", "Maintenance"];
const EMP_SITE = ["site-1", "site-2", "site-1", "site-2", "site-1", "site-1", "site-1", "site-3"];
const EMP_STATUS = ["actif", "actif", "actif", "actif", "arret_maladie", "actif", "actif", "reprise_prevue"];
export const employees: Row[] = EMP_FIRST.map((f, i) => ({
  id: `emp-${i + 1}`,
  company_id: C,
  first_name: f,
  last_name: EMP_LAST[i],
  job_title: EMP_JOB[i],
  job_family: EMP_FAMILY[i],
  service: EMP_FAMILY[i] === "Conducteur" ? "Transport" : EMP_FAMILY[i] === "Cariste" ? "Entrepôt" : "Support",
  site_id: EMP_SITE[i],
  contract_type: i % 4 === 3 ? "Intérim" : "CDI",
  hire_date: iso(-(i + 1) * 300),
  contract_end_date: i % 4 === 3 ? iso(60) : null,
  email: `salarie${i + 1}@transpilot-demo.fr`,
  phone: `06 12 34 5${i} 0${i}`,
  status: EMP_STATUS[i],
  responsible_id: "p-rh",
  supervisor_id: "p-qhse",
  ...archivable,
}));

// --- Personnel : certifications (formations, habilitations, VM, permis, EPI) ---
type CertSeed = { emp: string; type: string; category: string; title: string; obtained: number; expiry: number };
const CERT_SEED: CertSeed[] = [
  { emp: "emp-1", type: "LICENSE", category: "Permis EC", title: "Permis poids lourd EC", obtained: -1500, expiry: -6 },
  { emp: "emp-1", type: "FORMATION", category: "FIMO", title: "FIMO marchandises", obtained: -1200, expiry: 120 },
  { emp: "emp-1", type: "MEDICAL_VISIT", category: "Visite médicale", title: "Visite médicale périodique", obtained: -320, expiry: 40 },
  { emp: "emp-2", type: "FORMATION", category: "FCO", title: "FCO marchandises", obtained: -900, expiry: 25 },
  { emp: "emp-2", type: "HABILITATION", category: "Habilitation électrique B0/H0", title: "Habilitation électrique B0", obtained: -700, expiry: -6 },
  { emp: "emp-3", type: "AUTHORIZATION", category: "CACES R489", title: "CACES R489 catégorie 3", obtained: -800, expiry: 15 },
  { emp: "emp-3", type: "PPE", category: "EPI", title: "Dotation EPI cariste", obtained: -200, expiry: -5 },
  { emp: "emp-3", type: "FORMATION", category: "SST", title: "Sauveteur secouriste du travail", obtained: -400, expiry: 200 },
  { emp: "emp-5", type: "LICENSE", category: "Carte conducteur", title: "Carte conducteur", obtained: -1000, expiry: 75 },
  { emp: "emp-6", type: "AUTHORIZATION", category: "CACES R485", title: "CACES R485 gerbeur", obtained: -600, expiry: 8 },
  { emp: "emp-6", type: "MEDICAL_VISIT", category: "Visite médicale", title: "Visite médicale périodique", obtained: -350, expiry: -12 },
  { emp: "emp-8", type: "HABILITATION", category: "Habilitation électrique BR", title: "Habilitation électrique BR", obtained: -500, expiry: 90 },
];
function certStatus(days: number): string {
  if (days < 0) return "EXPIRED";
  if (days <= 30) return "EXPIRING_SOON";
  return "COMPLIANT";
}
export const employee_certifications: Row[] = CERT_SEED.map((c, i) => ({
  id: `cert-${i + 1}`,
  company_id: C,
  employee_id: c.emp,
  type: c.type,
  category: c.category,
  title: c.title,
  obtained_date: iso(c.obtained),
  expiry_date: iso(c.expiry),
  status: certStatus(c.expiry),
  priority: c.expiry < 0 ? "CRITICAL" : c.expiry <= 30 ? "HIGH" : "MEDIUM",
  document_id: null,
  responsible_id: "p-rh",
  supervisor_id: "p-qhse",
  notes: null,
  ...archivable,
}));

// --- Personnel : absences & aptitude (sans diagnostic médical) ---------
export const employee_absences: Row[] = [
  { id: "abs-1", company_id: C, employee_id: "emp-5", is_sick_leave: true, start_date: iso(-10), expected_end_date: iso(20), return_date: null, work_status: "arret_maladie", aptitude: null, restrictions: null, next_medical_visit: iso(22), return_visit_required: true, document_id: null, responsible_id: "p-rh", internal_notes: "Reprise à confirmer avec la médecine du travail.", ...archivable },
  { id: "abs-2", company_id: C, employee_id: "emp-8", is_sick_leave: false, start_date: iso(-30), expected_end_date: iso(-2), return_date: iso(-1), work_status: "reprise_prevue", aptitude: "FIT_WITH_RESTRICTIONS", restrictions: "Pas de port de charge lourde pendant 1 mois", next_medical_visit: iso(15), return_visit_required: true, document_id: null, responsible_id: "p-rh", internal_notes: "Aménagement de poste temporaire.", ...archivable },
];

// --- EPI ---------------------------------------------------------------
const EPI_TYPE = ["Casque", "Harnais", "Chaussures de sécurité", "Détecteur de gaz", "Gants", "Lunettes", "Protections auditives", "Casque"];
const EPI_RENEW = [-20, 10, 25, 90, 180, -5, 45, 300];
export const epi: Row[] = EPI_TYPE.map((t, i) => ({
  id: `epi-${i + 1}`,
  company_id: C,
  epi_type: t,
  internal_reference: `EPI-${String(i + 1).padStart(4, "0")}`,
  assigned_employee_id: `emp-${i + 1}`,
  issue_date: iso(-(i + 1) * 40),
  renewal_date: iso(EPI_RENEW[i]),
  status: "actif",
  responsible_id: "p-qhse",
  supervisor_id: "p-qhse",
  ...archivable,
}));

// --- Équipements -------------------------------------------------------
const EQ_NAME = ["Hayon élévateur", "Chariot élévateur CH-12", "Pont roulant", "Compresseur", "Groupe froid", "Transpalette"];
const EQ_TYPE = ["Levage", "Manutention", "Levage", "Pneumatique", "Froid", "Manutention"];
const EQ_SITE = ["Dépôt Nord", "Dépôt Sud", "Atelier", "Atelier", "Dépôt Nord", "Quai 3"];
const EQ_CATEGORY = ["Hayon élévateur", "Chariot élévateur", "Pont roulant", "Compresseur", "Groupe froid", "Transpalette électrique"];
const EQ_SITE_ID = ["site-1", "site-1", "site-3", "site-3", "site-1", "site-1"];
const EQ_NEXT = [40, -3, 120, 15, 200, 8];
const EQ_PROV = ["prov-3", "prov-3", "prov-2", "prov-2", null, "prov-3"];
export const equipments: Row[] = EQ_NAME.map((n, i) => ({
  id: `eqp-${i + 1}`,
  company_id: C,
  name: n,
  equipment_type: EQ_TYPE[i],
  category: EQ_CATEGORY[i],
  serial_number: `SN-${String(1000 + i * 37)}`,
  site: EQ_SITE[i],
  site_id: EQ_SITE_ID[i],
  internal_reference: `EQ-${String(i + 1).padStart(4, "0")}`,
  last_check_date: iso(EQ_NEXT[i] - 365),
  next_check_date: iso(EQ_NEXT[i]),
  frequency: "annuelle",
  provider_id: EQ_PROV[i],
  priority: EQ_NEXT[i] < 0 ? "CRITICAL" : EQ_NEXT[i] <= 30 ? "HIGH" : "MEDIUM",
  notes: null,
  status: "actif",
  responsible_id: "p-maint",
  supervisor_id: "p-qhse",
  ...archivable,
}));

// --- Véhicules ---------------------------------------------------------
const V_TYPE = ["Poids lourd", "Utilitaire", "Tracteur routier", "Fourgon"];
const V_BRAND = ["Renault", "Volvo", "MAN", "Iveco", "Mercedes"];
const V_SITE = ["site-1", "site-2", "site-1", "site-3"];
const V_CT = [-40, 12, 200, 60, -8, 90, 25, 300, 45, 5];
const V_INS = [12, 300, -5, 80, 150, 20, -10, 200, 60, 40];
export const vehicles: Row[] = Array.from({ length: 10 }, (_, k) => {
  const i = k + 1;
  return {
    id: `veh-${i}`,
    company_id: C,
    registration_number: i === 1 ? "AB-123-CD" : `AA-${String(i).padStart(3, "0")}-BB`,
    vehicle_type: V_TYPE[i % 4],
    brand: V_BRAND[i % 5],
    model: `Série ${i}`,
    service_date: iso(-i * 130),
    site_id: V_SITE[i % 4],
    main_driver_id: i <= 8 ? `emp-${i}` : null,
    fleet_manager_id: "p-parc",
    insurance_expiry: iso(V_INS[k]),
    technical_inspection_expiry: iso(V_CT[k]),
    last_maintenance: iso(-90 - i * 10),
    next_maintenance: iso(90 - i * 5),
    mileage: 60000 + i * 12500,
    tachograph_expiry: i % 2 === 0 ? iso(V_CT[k] + 30) : null,
    extinguisher_expiry: iso(V_INS[k] - 15),
    priority: V_CT[k] < 0 || V_INS[k] < 0 ? "CRITICAL" : "MEDIUM",
    notes: null,
    status: i % 3 === 2 ? "maintenance" : "actif",
    responsible_id: "p-parc",
    supervisor_id: "p-expl",
    ...archivable,
  };
});

// --- Obligations : rattachées à leur module métier + entité liée -------
const FREQ = ["annuelle", "annuelle", "semestrielle", "trimestrielle", "unique"];
const PRIO = ["LOW", "MEDIUM", "CRITICAL"];
function compliance(days: number): string {
  if (days < 0) return "EXPIRED";
  if (days <= 30) return "EXPIRING_SOON";
  return "COMPLIANT";
}

const OBL_DEFS: {
  title: string;
  category: string;
  module: string;
  ret: string | null;
  ent: string | null;
  due: number;
}[] = [
  { title: "Contrôle technique", category: "vehicule", module: "VEHICLES", ret: "VEHICLE", ent: "veh-1", due: -40 },
  { title: "Assurance véhicule", category: "vehicule", module: "VEHICLES", ret: "VEHICLE", ent: "veh-1", due: 12 },
  { title: "Tachygraphe", category: "vehicule", module: "VEHICLES", ret: "VEHICLE", ent: "veh-3", due: 5 },
  { title: "Extincteur véhicule", category: "vehicule", module: "VEHICLES", ret: "VEHICLE", ent: "veh-2", due: 60 },
  { title: "Visite médicale", category: "conducteur", module: "PERSONNEL", ret: "EMPLOYEE", ent: "emp-4", due: 25 },
  { title: "Renouvellement permis", category: "conducteur", module: "PERSONNEL", ret: "DRIVER", ent: "emp-1", due: -6 },
  { title: "FIMO", category: "conducteur", module: "PERSONNEL", ret: "DRIVER", ent: "emp-5", due: 120 },
  { title: "Vérification levage", category: "equipement", module: "EQUIPMENT", ret: "EQUIPMENT", ent: "eqp-2", due: -3 },
  { title: "Contrôle réglementaire équipement", category: "equipement", module: "EQUIPMENT", ret: "EQUIPMENT", ent: "eqp-3", due: 18 },
  { title: "Audit interne QHSE", category: "audit", module: "REGULATORY_CONTROLS", ret: null, ent: null, due: 200 },
  { title: "Habilitation électrique", category: "formation", module: "PERSONNEL", ret: "EMPLOYEE", ent: "emp-2", due: -6 },
  { title: "Formation ADR", category: "formation", module: "PERSONNEL", ret: "EMPLOYEE", ent: "emp-6", due: 40 },
  { title: "Contrôle extincteurs site", category: "site", module: "SITES", ret: "SITE", ent: "site-1", due: 8 },
  { title: "Carte conducteur", category: "conducteur", module: "PERSONNEL", ret: "DRIVER", ent: "emp-8", due: 75 },
];

export const obligations: Row[] = OBL_DEFS.map((d, k) => {
  const i = k + 1;
  return {
    id: `obl-${i}`,
    company_id: C,
    title: d.title,
    category: d.category,
    module: d.module,
    related_entity_type: d.ret,
    related_entity_id: d.ent,
    provider_id: null,
    description: "Obligation de conformité à suivre — échéance de référence.",
    notes: null,
    due_date: iso(d.due),
    frequency: FREQ[i % 5],
    priority: PRIO[i % 3],
    status: compliance(d.due),
    responsible_id: i % 5 === 0 ? null : "p-qhse",
    supervisor_id: "p-qhse",
    linked_vehicle_id: d.ret === "VEHICLE" ? d.ent : null,
    linked_employee_id: d.ret === "EMPLOYEE" || d.ret === "DRIVER" ? d.ent : null,
    linked_equipment_id: d.ret === "EQUIPMENT" ? d.ent : null,
    comments: null,
    ...archivable,
  };
});

// --- Documents ---------------------------------------------------------
const DOC_TITLE = ["CT_2025.pdf", "Attestation_assurance.pdf", "Carte_tachy.pdf", "Certificat_extincteur.pdf", "Visite_medicale.pdf", "Permis.pdf", "FIMO.pdf", "Rapport_levage.pdf", "PV_controle.pdf", "Registre.pdf"];
const DOC_TYPE = ["Contrôle", "Assurance", "Carte", "Certificat", "Médical", "Permis", "Formation", "Rapport", "PV", "Registre"];
const DOC_EXP = [-30, -5, 90, 180, -15, 45, 300, 20, -2, 150];
export const documents: Row[] = DOC_TITLE.map((t, k) => {
  const i = k + 1;
  const exp = DOC_EXP[k];
  return {
    id: `doc-${i}`,
    company_id: C,
    title: t,
    document_type: DOC_TYPE[k],
    file_url: null,
    file_path: null,
    expiration_date: iso(exp),
    status: exp < 0 ? "EXPIRED" : "COMPLIANT",
    obligation_id: `obl-${i}`,
    vehicle_id: i % 2 === 0 ? `veh-${1 + (i % 10)}` : null,
    employee_id: null,
    equipment_id: null,
    epi_id: i % 3 === 0 ? `epi-${1 + (i % 8)}` : null,
    provider_id: i === 2 ? "prov-6" : i === 8 ? "prov-3" : null,
    site_id: i === 4 ? "site-1" : null,
    responsible_id: "p-qhse",
    supervisor_id: "p-qhse",
    uploaded_by: "p-admin",
    ...archivable,
  };
});

// --- Actions -----------------------------------------------------------
type ActionSeed = {
  title: string; category: string; status: string; priority: string; due: number;
  assigned_to: string; supervisor_id: string; obligation_id: string;
  ret?: string; rid?: string; source?: string; proof?: string;
};
const ACTION_SEED: ActionSeed[] = [
  { title: "Renouveler habilitation électrique - 4 salariés", category: "RH", status: "TODO", priority: "CRITICAL", due: 0, assigned_to: "p-rh", supervisor_id: "p-qhse", obligation_id: "obl-11", ret: "EMPLOYEE", rid: "emp-2", source: "Habilitation expirée", proof: "Certificat d'habilitation" },
  { title: "Contrôle chariot élévateur CH-12", category: "Maintenance", status: "TODO", priority: "CRITICAL", due: 3, assigned_to: "p-maint", supervisor_id: "p-qhse", obligation_id: "obl-9", ret: "EQUIPMENT", rid: "eqp-2", source: "Contrôle levage à échéance", proof: "Rapport VGP" },
  { title: "Ajouter rapport extincteurs atelier", category: "Maintenance", status: "PLANNED", priority: "HIGH", due: 15, assigned_to: "p-maint", supervisor_id: "p-qhse", obligation_id: "obl-13", ret: "SITE", rid: "site-1", source: "Contrôle extincteurs", proof: "Rapport de contrôle" },
  { title: "Vérifier assurance véhicule AB-123-CD", category: "Parc", status: "TODO", priority: "HIGH", due: 10, assigned_to: "p-parc", supervisor_id: "p-expl", obligation_id: "obl-2", ret: "VEHICLE", rid: "veh-1", source: "Assurance bientôt expirée", proof: "Attestation d'assurance" },
  { title: "Planifier visite médecine du travail", category: "RH", status: "PLANNED", priority: "MEDIUM", due: 21, assigned_to: "p-rh", supervisor_id: "p-qhse", obligation_id: "obl-5", ret: "EMPLOYEE", rid: "emp-4", source: "Visite médicale à échéance", proof: "Avis d'aptitude" },
  { title: "Contrôler un extincteur", category: "Maintenance", status: "IN_PROGRESS", priority: "MEDIUM", due: 5, assigned_to: "p-maint", supervisor_id: "p-qhse", obligation_id: "obl-4" },
  { title: "Relancer le prestataire de contrôle", category: "QHSE", status: "LATE", priority: "HIGH", due: -12, assigned_to: "p-qhse", supervisor_id: "p-admin", obligation_id: "obl-1", ret: "VEHICLE", rid: "veh-1", source: "Contrôle technique dépassé", proof: "PV de contrôle" },
  { title: "Mettre à jour la carte conducteur", category: "RH", status: "TODO", priority: "MEDIUM", due: -2, assigned_to: "p-rh", supervisor_id: "p-qhse", obligation_id: "obl-14" },
  { title: "Archiver un ancien PV", category: "QHSE", status: "DONE", priority: "LOW", due: -20, assigned_to: "p-qhse", supervisor_id: "p-admin", obligation_id: "obl-10" },
];
export const actions: Row[] = ACTION_SEED.map((a, k) => ({
  id: `act-${k + 1}`,
  company_id: C,
  title: a.title,
  description: "Tâche à réaliser pour rester conforme.",
  category: a.category,
  related_entity_type: a.ret ?? null,
  related_entity_id: a.rid ?? null,
  source: a.source ?? null,
  expected_proof: a.proof ?? null,
  status: a.status,
  priority: a.priority,
  due_date: iso(a.due),
  assigned_to: a.assigned_to,
  supervisor_id: a.supervisor_id,
  obligation_id: a.obligation_id,
  comment: null,
  completed_at: a.status === "DONE" ? NOW : null,
  completed_by: a.status === "DONE" ? "p-qhse" : null,
  created_by: "p-admin",
  archive_reason: null,
  ...archivable,
}));

// --- Notifications -----------------------------------------------------
const NOTIF = [
  { title: "Visite médicale à planifier", type: "DUE_SOON", priority: "MEDIUM", rid: "obl-5", rt: "obligation" },
  { title: "Contrôle machine à réaliser", type: "CONTROL_TO_PLAN", priority: "HIGH", rid: "obl-9", rt: "obligation" },
  { title: "Document expiré", type: "EXPIRED", priority: "CRITICAL", rid: "doc-1", rt: "document" },
  { title: "Permis bientôt expiré", type: "DUE_SOON", priority: "MEDIUM", rid: "obl-6", rt: "obligation" },
  { title: "Preuve manquante", type: "MISSING_DOCUMENT", priority: "HIGH", rid: "obl-11", rt: "obligation" },
  { title: "Action en retard", type: "ACTION_LATE", priority: "CRITICAL", rid: "act-7", rt: "action" },
];
export const notifications: Row[] = NOTIF.map((n, k) => ({
  id: `ntf-${k + 1}`,
  company_id: C,
  user_id: "p-admin",
  title: n.title,
  message: "Échéance ou action nécessitant votre attention.",
  type: n.type,
  priority: n.priority,
  related_entity_type: n.rt,
  related_entity_id: n.rid,
  obligation_id: n.rt === "obligation" ? n.rid : null,
  action_id: n.rt === "action" ? n.rid : null,
  is_read: k > 4,
  read_at: null,
  created_at: NOW,
}));

// --- Réglages notifications & imports ----------------------------------
export const notification_settings: Row[] = [
  { id: "ns-1", tenant_id: C, alert_days_before_due: 30, notify_responsible: true, notify_supervisor: true, notify_admin: false, email_enabled: false, created_at: NOW, updated_at: NOW },
];

export const imports: Row[] = [
  { id: "imp-1", company_id: C, file_name: "vehicules_2025.xlsx", file_url: null, import_type: "vehicles", status: "traite", total_rows: 10, imported_rows: 10, failed_rows: 0, error_log: null, uploaded_by: "p-admin", created_at: NOW },
  { id: "imp-2", company_id: C, file_name: "salaries.csv", file_url: null, import_type: "employees", status: "traite", total_rows: 8, imported_rows: 7, failed_rows: 1, error_log: null, uploaded_by: "p-admin", created_at: NOW },
];

// --- Sites et locaux ---------------------------------------------------
export const sites: Row[] = [
  { id: "site-1", company_id: C, name: "Entrepôt Marseille", site_type: "Entrepôt", address: "Zone logistique Sud", city: "Marseille", postal_code: "13011", country: "France", surface_area: 4200, activity_type: "Logistique", manager_id: "p-expl", supervisor_id: "p-qhse", status: "actif", notes: null, ...archivable },
  { id: "site-2", company_id: C, name: "Bureau Lyon", site_type: "Bureau", address: "12 rue de la Part-Dieu", city: "Lyon", postal_code: "69003", country: "France", surface_area: 650, activity_type: "Administratif", manager_id: "p-admin", supervisor_id: "p-qhse", status: "actif", notes: null, ...archivable },
  { id: "site-3", company_id: C, name: "Atelier maintenance", site_type: "Atelier", address: "8 avenue des Ateliers", city: "Vénissieux", postal_code: "69200", country: "France", surface_area: 1800, activity_type: "Maintenance", manager_id: "p-maint", supervisor_id: "p-qhse", status: "actif", notes: null, ...archivable },
];

// --- Prestataires ------------------------------------------------------
export const providers: Row[] = [
  { id: "prov-1", name: "SécuriFeu Contrôles", provider_type: "Maintenance extincteurs", contact_name: "M. Fabre", email: "contact@securifeu.fr", phone: "04 91 00 00 01", city: "Marseille", site_id: "site-1", insurance: 20, followup: true },
  { id: "prov-2", name: "ElecCheck Pro", provider_type: "Maintenance électrique", contact_name: "Mme Roy", email: "contact@eleccheck.fr", phone: "04 72 00 00 02", city: "Lyon", site_id: "site-3", insurance: 200, followup: false },
  { id: "prov-3", name: "Garage Transport Services", provider_type: "Maintenance véhicules", contact_name: "M. Léon", email: "contact@gts.fr", phone: "04 72 00 00 03", city: "Vénissieux", site_id: "site-3", insurance: 150, followup: false },
  { id: "prov-4", name: "Médecine du Travail Régionale", provider_type: "Médecine du travail", contact_name: "Dr. Meyer", email: "contact@mtr.fr", phone: "04 78 00 00 04", city: "Lyon", site_id: "site-2", insurance: 300, followup: false },
  { id: "prov-5", name: "Formation Sécurité Plus", provider_type: "Organisme de formation", contact_name: "Mme Aziz", email: "contact@fsp.fr", phone: "04 91 00 00 05", city: "Marseille", site_id: "site-1", insurance: 90, followup: false },
  { id: "prov-6", name: "Assurance Pro Entreprise", provider_type: "Assurance", contact_name: "M. Blanc", email: "contact@ape.fr", phone: "01 40 00 00 06", city: "Paris", site_id: null, insurance: -10, followup: true },
].map((p) => ({
  id: p.id, name: p.name, provider_type: p.provider_type, contact_name: p.contact_name, email: p.email, phone: p.phone, city: p.city,
  company_id: C, address: null, country: "France", notes: null, is_active: true,
  site_id: p.site_id, responsible_id: "p-qhse", insurance_expiry: iso(p.insurance), priority: p.insurance < 0 ? "CRITICAL" : "MEDIUM", needs_followup: p.followup,
  ...archivable,
}));

// --- Contrats ----------------------------------------------------------
export const contracts: Row[] = [
  { id: "ctr-1", title: "Contrat maintenance extincteurs", contract_type: "Maintenance extincteurs", provider_id: "prov-1", site_id: "site-1", status: "ACTIVE", renewal: 45 },
  { id: "ctr-2", title: "Contrat alarme incendie", contract_type: "Maintenance alarme", provider_id: "prov-1", site_id: "site-1", status: "TO_RENEW", renewal: 20 },
  { id: "ctr-3", title: "Assurance multirisque locaux", contract_type: "Assurance multirisque", provider_id: "prov-6", site_id: "site-2", status: "ACTIVE", renewal: 90 },
  { id: "ctr-4", title: "Contrat entretien véhicules", contract_type: "Maintenance véhicules", provider_id: "prov-3", site_id: "site-3", status: "ACTIVE", renewal: 130 },
  { id: "ctr-5", title: "Contrat médecine du travail", contract_type: "Médecine du travail", provider_id: "prov-4", site_id: "site-2", status: "TO_RENEW", renewal: 12 },
  { id: "ctr-6", title: "Contrat maintenance électrique", contract_type: "Maintenance électrique", provider_id: "prov-2", site_id: "site-3", status: "EXPIRED", renewal: -8 },
].map((c) => ({
  id: c.id, company_id: C, title: c.title, contract_type: c.contract_type, provider_id: c.provider_id,
  site_id: c.site_id, related_entity_type: null, related_entity_id: null,
  start_date: iso(-365), end_date: iso(c.renewal), renewal_date: iso(c.renewal),
  notice_period_days: 30, amount: 4800, currency: "EUR",
  responsible_id: "p-qhse", supervisor_id: "p-admin", status: c.status, document_id: null, notes: null, ...archivable,
}));

// --- Audits & inspections ---------------------------------------------
export const audits: Row[] = [
  { id: "aud-1", title: "Audit sécurité semestriel", audit_type: "Audit sécurité", site_id: "site-1", status: "DONE", result: "MINOR_NC", planned: -20, completed: -18, score: 82 },
  { id: "aud-2", title: "Audit client logistique", audit_type: "Audit client", site_id: "site-1", status: "IN_PROGRESS", result: null, planned: 5, completed: null, score: null },
  { id: "aud-3", title: "Inspection interne entrepôt", audit_type: "Audit interne", site_id: "site-1", status: "PLANNED", result: null, planned: 30, completed: null, score: null },
  { id: "aud-4", title: "Visite sécurité atelier", audit_type: "Visite sécurité", site_id: "site-3", status: "LATE", result: null, planned: -5, completed: null, score: null },
].map((a) => ({
  id: a.id, company_id: C, title: a.title, audit_type: a.audit_type, site_id: a.site_id,
  auditor_name: "Cabinet QHSE Conseil", provider_id: null,
  planned_date: iso(a.planned), completed_date: a.completed != null ? iso(a.completed) : null,
  status: a.status, result: a.result, score: a.score,
  responsible_id: "p-qhse", supervisor_id: "p-admin",
  report_document_id: a.id === "aud-1" ? "doc-8" : null, notes: null, ...archivable,
}));

// --- Non-conformités ---------------------------------------------------
type NcSeed = {
  id: string; title: string; severity: string; source_type: string; source_id?: string | null;
  site_id: string | null; status: string; detected: number; due?: number;
  ret?: string; rid?: string; corrective?: string;
};
const NC_SEED: NcSeed[] = [
  { id: "nc-1", title: "Registre sécurité non mis à jour", severity: "MEDIUM", source_type: "Audit", source_id: "aud-1", site_id: "site-1", status: "OPEN", detected: -10, due: 20, ret: "SITE", rid: "site-1" },
  { id: "nc-2", title: "Contrôle gaz expiré", severity: "HIGH", source_type: "Contrôle", site_id: "site-3", status: "IN_PROGRESS", detected: -25, due: 5, ret: "SITE", rid: "site-3", corrective: "act-6" },
  { id: "nc-3", title: "Rapport extincteurs manquant", severity: "MEDIUM", source_type: "Document", site_id: "site-1", status: "OPEN", detected: -6, due: 15, ret: "SITE", rid: "site-1", corrective: "act-3" },
  { id: "nc-4", title: "Pneus véhicule AB-123-CD à contrôler", severity: "HIGH", source_type: "Véhicule", site_id: null, status: "OPEN", detected: -3, due: 7, ret: "VEHICLE", rid: "veh-1" },
  { id: "nc-5", title: "Action corrective audit client non terminée", severity: "CRITICAL", source_type: "Audit", source_id: "aud-2", site_id: "site-1", status: "IN_PROGRESS", detected: -30, due: -2, ret: "SITE", rid: "site-1", corrective: "act-7" },
];
export const non_conformities: Row[] = NC_SEED.map((n) => ({
  id: n.id, company_id: C, title: n.title, description: "Écart constaté à traiter.", severity: n.severity,
  source_type: n.source_type, source_id: n.source_id ?? null, site_id: n.site_id,
  related_entity_type: n.ret ?? null, related_entity_id: n.rid ?? null,
  detected_at: iso(n.detected), due_date: n.due != null ? iso(n.due) : null,
  responsible_id: "p-qhse", supervisor_id: "p-admin", status: n.status,
  corrective_action_id: n.corrective ?? null, document_id: null, ...archivable,
}));

// --- Incidents & observations sécurité ---------------------------------
type IncSeed = { id: string; type: string; title: string; site_id: string | null; zone: string | null; severity: string; status: string; occurred: number; corrective?: string };
const INC_SEED: IncSeed[] = [
  { id: "inc-1", type: "NEAR_MISS", title: "Presque-accident chariot élévateur sur zone de circulation", site_id: "site-1", zone: "Zone caristes", severity: "HIGH", status: "OPEN", occurred: -4 },
  { id: "inc-2", type: "OBSERVATION", title: "Port des EPI non respecté au quai", site_id: "site-1", zone: "Quai 3", severity: "MEDIUM", status: "IN_PROGRESS", occurred: -9, corrective: "act-3" },
  { id: "inc-3", type: "INCIDENT", title: "Choc palette contre rack de stockage", site_id: "site-3", zone: "Stockage A", severity: "MEDIUM", status: "OPEN", occurred: -2 },
];
export const incidents: Row[] = INC_SEED.map((n) => ({
  id: n.id, company_id: C, type: n.type, title: n.title, description: "Événement terrain à traiter.",
  site_id: n.site_id, zone: n.zone, occurred_at: iso(n.occurred), severity: n.severity, status: n.status,
  responsible_id: "p-qhse", supervisor_id: "p-expl", related_entity_type: n.site_id ? "SITE" : null,
  related_entity_id: n.site_id, corrective_action_id: n.corrective ?? null, document_id: null, ...archivable,
}));

// Registre des tables pour le client mock
export const TABLES: Record<string, Row[]> = {
  companies: [company],
  profiles,
  employees,
  employee_certifications,
  employee_absences,
  epi,
  equipments,
  vehicles,
  obligations,
  documents,
  actions,
  notifications,
  notification_settings,
  imports,
  sites,
  providers,
  contracts,
  audits,
  non_conformities,
  incidents,
  audit_logs: [],
  pilot_leads: [],
};
