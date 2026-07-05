import { createClient } from "@/lib/supabase/server";
import type {
  ActionRow,
  Audit,
  Contract,
  DocumentRow,
  Employee,
  Epi,
  Equipment,
  ImportRow,
  NonPilotix,
  Notification,
  Obligation,
  Provider,
  Profile,
  Site,
  Vehicle,
} from "@/lib/types/database";

export interface ListFilters {
  search?: string;
  status?: string;
  category?: string;
  module?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE = 20;

function range(page = 1, pageSize = PAGE_SIZE) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export async function getVehicles(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("vehicles")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (filters.search) q = q.ilike("registration_number", `%${filters.search}%`);
  const { data, count } = await q;
  return { rows: (data as Vehicle[]) ?? [], count: count ?? 0 };
}

export async function getEmployees(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("employees")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("last_name", { ascending: true })
    .range(from, to);
  if (filters.search) q = q.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
  const { data, count } = await q;
  return { rows: (data as Employee[]) ?? [], count: count ?? 0 };
}

export async function getEquipments(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("equipments")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("name", { ascending: true })
    .range(from, to);
  if (filters.search) q = q.ilike("name", `%${filters.search}%`);
  const { data, count } = await q;
  return { rows: (data as Equipment[]) ?? [], count: count ?? 0 };
}

export async function getEpis(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("epi")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("renewal_date", { ascending: true, nullsFirst: false })
    .range(from, to);
  if (filters.search)
    q = q.or(`epi_type.ilike.%${filters.search}%,internal_reference.ilike.%${filters.search}%`);
  const { data, count } = await q;
  return { rows: (data as Epi[]) ?? [], count: count ?? 0 };
}

export async function getEpi(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("epi").select("*").eq("id", id).single();
  return data as Epi | null;
}

/** Map id -> "Prénom Nom" pour afficher les salariés assignés dans une liste. */
export async function getEmployeeNames(companyId: string): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("company_id", companyId);
  const map = new Map<string, string>();
  for (const e of (data as Pick<Employee, "id" | "first_name" | "last_name">[]) ?? []) {
    map.set(e.id, [e.first_name, e.last_name].filter(Boolean).join(" "));
  }
  return map;
}

// --- Modules métier (Prompt 2) ----------------------------------------
export async function getSites(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("sites")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("name", { ascending: true })
    .range(from, to);
  if (filters.search) q = q.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
  const { data, count } = await q;
  return { rows: (data as Site[]) ?? [], count: count ?? 0 };
}

export async function getSite(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("sites").select("*").eq("id", id).single();
  return data as Site | null;
}

export async function getProviders(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("providers")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("name", { ascending: true })
    .range(from, to);
  if (filters.search) q = q.ilike("name", `%${filters.search}%`);
  const { data, count } = await q;
  return { rows: (data as Provider[]) ?? [], count: count ?? 0 };
}

export async function getContracts(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("contracts")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("renewal_date", { ascending: true, nullsFirst: false })
    .range(from, to);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  if (filters.status) q = q.eq("status", filters.status);
  const { data, count } = await q;
  return { rows: (data as Contract[]) ?? [], count: count ?? 0 };
}

export async function getAudits(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("audits")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("planned_date", { ascending: false, nullsFirst: false })
    .range(from, to);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  if (filters.status) q = q.eq("status", filters.status);
  const { data, count } = await q;
  return { rows: (data as Audit[]) ?? [], count: count ?? 0 };
}

export async function getNonConformities(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("non_conformities")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("detected_at", { ascending: false, nullsFirst: false })
    .range(from, to);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  if (filters.status) q = q.eq("status", filters.status);
  const { data, count } = await q;
  return { rows: (data as NonPilotix[]) ?? [], count: count ?? 0 };
}

export interface EntityCompliance {
  status: "ok" | "warn" | "danger" | "none";
  nextDue: string | null;
  missingDocs: number;
  lateActions: number;
  obligations: number;
}

const TONE_RANK: Record<string, number> = { none: 0, ok: 1, warn: 2, danger: 3 };

/**
 * Résumé de conformité par entité (agrégé depuis ses obligations liées) :
 * pire statut, prochaine échéance, documents manquants, actions en retard.
 * `relatedTypes` = valeurs related_entity_type (ex: ['EMPLOYEE','DRIVER']).
 */
export async function getEntityComplianceMap(
  companyId: string,
  relatedTypes: string[]
): Promise<Map<string, EntityCompliance>> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  const { data: oblData } = await supabase
    .from("obligations")
    .select("id, related_entity_id, due_date")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .in("related_entity_type", relatedTypes)
    .not("related_entity_id", "is", null);
  const obls = (oblData as { id: string; related_entity_id: string; due_date: string | null }[]) ?? [];

  const map = new Map<string, EntityCompliance>();
  if (obls.length === 0) return map;

  const oblIds = obls.map((o) => o.id);

  const withDoc = new Set<string>();
  const { data: docData } = await supabase
    .from("documents")
    .select("obligation_id")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .in("obligation_id", oblIds);
  for (const d of docData ?? []) if (d.obligation_id) withDoc.add(d.obligation_id as string);

  const lateByObl = new Map<string, number>();
  const { data: actData } = await supabase
    .from("actions")
    .select("obligation_id, status, due_date")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .in("obligation_id", oblIds)
    .neq("status", "DONE")
    .lt("due_date", today);
  for (const a of actData ?? [])
    if (a.obligation_id) lateByObl.set(a.obligation_id as string, (lateByObl.get(a.obligation_id as string) ?? 0) + 1);

  for (const o of obls) {
    const eid = o.related_entity_id;
    const cur = map.get(eid) ?? { status: "none", nextDue: null, missingDocs: 0, lateActions: 0, obligations: 0 };
    const bucket = !o.due_date ? "none" : o.due_date < today ? "danger" : o.due_date <= in30 ? "warn" : "ok";
    if (TONE_RANK[bucket] > TONE_RANK[cur.status]) cur.status = bucket as EntityCompliance["status"];
    if (o.due_date && (!cur.nextDue || o.due_date < cur.nextDue)) cur.nextDue = o.due_date;
    if (!withDoc.has(o.id)) cur.missingDocs += 1;
    cur.lateActions += lateByObl.get(o.id) ?? 0;
    cur.obligations += 1;
    map.set(eid, cur);
  }
  return map;
}

/**
 * Résout, pour chaque document, l'entité à laquelle il est rattaché
 * (contrat, véhicule, salarié, équipement, EPI, ou via son obligation → site…).
 * Retourne Map<documentId, "Véhicule AB-123-CD">.
 */
export async function getDocumentLinkMap(
  companyId: string,
  docs: DocumentRow[]
): Promise<Map<string, string>> {
  const supabase = await createClient();
  const [veh, emp, eqp, epis, sites, obl, ctr] = await Promise.all([
    supabase.from("vehicles").select("id, registration_number").eq("company_id", companyId),
    supabase.from("employees").select("id, first_name, last_name").eq("company_id", companyId),
    supabase.from("equipments").select("id, name").eq("company_id", companyId),
    supabase.from("epi").select("id, epi_type").eq("company_id", companyId),
    supabase.from("sites").select("id, name").eq("company_id", companyId),
    supabase.from("obligations").select("id, title, related_entity_type, related_entity_id").eq("company_id", companyId),
    supabase.from("contracts").select("id, title, document_id").eq("company_id", companyId).not("document_id", "is", null),
  ]);

  const names = new Map<string, string>();
  for (const v of veh.data ?? []) names.set(v.id as string, v.registration_number as string);
  for (const e of emp.data ?? []) names.set(e.id as string, [e.first_name, e.last_name].filter(Boolean).join(" "));
  for (const q of eqp.data ?? []) names.set(q.id as string, q.name as string);
  for (const e of epis.data ?? []) names.set(e.id as string, e.epi_type as string);
  for (const s of sites.data ?? []) names.set(s.id as string, s.name as string);

  const oblById = new Map<string, { title: string; ret: string | null; rid: string | null }>();
  for (const o of obl.data ?? [])
    oblById.set(o.id as string, {
      title: o.title as string,
      ret: (o.related_entity_type as string) ?? null,
      rid: (o.related_entity_id as string) ?? null,
    });

  const contractByDoc = new Map<string, string>();
  for (const c of ctr.data ?? [])
    if (c.document_id) contractByDoc.set(c.document_id as string, c.title as string);

  const PREFIX: Record<string, string> = {
    VEHICLE: "Véhicule", EMPLOYEE: "Salarié", DRIVER: "Conducteur",
    EQUIPMENT: "Équipement", SITE: "Site", PPE: "EPI",
  };

  const result = new Map<string, string>();
  for (const d of docs) {
    let label = "—";
    if (contractByDoc.has(d.id)) label = `Contrat ${contractByDoc.get(d.id)}`;
    else if (d.vehicle_id) label = `Véhicule ${names.get(d.vehicle_id) ?? ""}`.trim();
    else if (d.employee_id) label = `Salarié ${names.get(d.employee_id) ?? ""}`.trim();
    else if (d.equipment_id) label = `Équipement ${names.get(d.equipment_id) ?? ""}`.trim();
    else if (d.epi_id) label = `EPI ${names.get(d.epi_id) ?? ""}`.trim();
    else if (d.obligation_id) {
      const o = oblById.get(d.obligation_id);
      if (o?.rid && names.has(o.rid)) label = `${PREFIX[o.ret ?? ""] ?? "Élément"} ${names.get(o.rid)}`;
      else if (o) label = `Obligation : ${o.title}`;
    }
    result.set(d.id, label);
  }
  return result;
}

/** id -> nom lisible pour véhicules / salariés / équipements / sites / EPI. */
export async function getEntityNameMap(companyId: string): Promise<Map<string, string>> {
  const supabase = await createClient();
  const [veh, emp, eqp, sites, epis] = await Promise.all([
    supabase.from("vehicles").select("id, registration_number").eq("company_id", companyId),
    supabase.from("employees").select("id, first_name, last_name").eq("company_id", companyId),
    supabase.from("equipments").select("id, name").eq("company_id", companyId),
    supabase.from("sites").select("id, name").eq("company_id", companyId),
    supabase.from("epi").select("id, epi_type").eq("company_id", companyId),
  ]);
  const m = new Map<string, string>();
  for (const v of veh.data ?? []) m.set(v.id as string, v.registration_number as string);
  for (const e of emp.data ?? []) m.set(e.id as string, [e.first_name, e.last_name].filter(Boolean).join(" "));
  for (const q of eqp.data ?? []) m.set(q.id as string, q.name as string);
  for (const s of sites.data ?? []) m.set(s.id as string, s.name as string);
  for (const e of epis.data ?? []) m.set(e.id as string, e.epi_type as string);
  return m;
}

export interface ArchivedItem {
  table: string;
  type: string;
  id: string;
  label: string;
  archived_at: string | null;
  archived_by: string | null;
}

const ARCHIVE_TABLES: { table: string; type: string; label: (r: Record<string, unknown>) => string }[] = [
  { table: "employees", type: "Salarié", label: (r) => [r.first_name, r.last_name].filter(Boolean).join(" ") },
  { table: "vehicles", type: "Véhicule", label: (r) => (r.registration_number as string) ?? "—" },
  { table: "equipments", type: "Équipement", label: (r) => (r.name as string) ?? "—" },
  { table: "epi", type: "EPI", label: (r) => (r.epi_type as string) ?? "—" },
  { table: "sites", type: "Site", label: (r) => (r.name as string) ?? "—" },
  { table: "obligations", type: "Obligation", label: (r) => (r.title as string) ?? "—" },
  { table: "documents", type: "Document", label: (r) => (r.title as string) ?? "—" },
  { table: "actions", type: "Action", label: (r) => (r.title as string) ?? "—" },
  { table: "providers", type: "Prestataire", label: (r) => (r.name as string) ?? "—" },
  { table: "contracts", type: "Contrat", label: (r) => (r.title as string) ?? "—" },
  { table: "audits", type: "Audit", label: (r) => (r.title as string) ?? "—" },
  { table: "non_conformities", type: "Non-conformité", label: (r) => (r.title as string) ?? "—" },
];

/** Tous les éléments archivés du tenant, tous modules confondus. */
export async function getArchivedItems(companyId: string): Promise<ArchivedItem[]> {
  const supabase = await createClient();
  const namesByProfile = new Map<string, string>();
  const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, email").eq("company_id", companyId);
  for (const p of profiles ?? [])
    namesByProfile.set(p.id as string, [p.first_name, p.last_name].filter(Boolean).join(" ") || (p.email as string) || "—");

  const results = await Promise.all(
    ARCHIVE_TABLES.map(async (t) => {
      const { data } = await supabase.from(t.table).select("*").eq("company_id", companyId).eq("is_archived", true);
      return (data ?? []).map((r) => ({
        table: t.table,
        type: t.type,
        id: r.id as string,
        label: t.label(r),
        archived_at: (r.archived_at as string) ?? null,
        archived_by: r.archived_by ? namesByProfile.get(r.archived_by as string) ?? null : null,
      }));
    })
  );
  return results.flat().sort((a, b) => (b.archived_at ?? "").localeCompare(a.archived_at ?? ""));
}

/** Par audit : nombre de non-conformités générées + actions ouvertes. */
export async function getAuditStatsMap(
  companyId: string,
  auditIds: string[]
): Promise<Map<string, { ncCount: number; openActions: number }>> {
  const map = new Map<string, { ncCount: number; openActions: number }>();
  if (auditIds.length === 0) return map;
  const supabase = await createClient();
  const [ncRes, actRes] = await Promise.all([
    supabase.from("non_conformities").select("source_id").eq("company_id", companyId).eq("source_type", "Audit").in("source_id", auditIds),
    supabase.from("actions").select("related_entity_id, status").eq("company_id", companyId).eq("related_entity_type", "AUDIT").in("related_entity_id", auditIds),
  ]);
  for (const id of auditIds) map.set(id, { ncCount: 0, openActions: 0 });
  for (const n of ncRes.data ?? []) {
    const e = map.get(n.source_id as string);
    if (e) e.ncCount += 1;
  }
  for (const a of actRes.data ?? []) {
    if (a.status === "DONE" || a.status === "CANCELLED" || a.status === "ARCHIVED") continue;
    const e = map.get(a.related_entity_id as string);
    if (e) e.openActions += 1;
  }
  return map;
}

export async function getSiteDetail(id: string) {
  const supabase = await createClient();
  const [site, obligations, contracts, audits] = await Promise.all([
    supabase.from("sites").select("*").eq("id", id).single(),
    supabase.from("obligations").select("*").eq("related_entity_id", id).eq("related_entity_type", "SITE").eq("is_archived", false),
    supabase.from("contracts").select("*").eq("site_id", id).eq("is_archived", false),
    supabase.from("audits").select("*").eq("site_id", id).eq("is_archived", false),
  ]);
  return {
    site: (site.data as Site) ?? null,
    obligations: (obligations.data as Obligation[]) ?? [],
    contracts: (contracts.data as Contract[]) ?? [],
    audits: (audits.data as Audit[]) ?? [],
  };
}

export async function getObligations(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("obligations")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .range(from, to);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.module) q = q.eq("module", filters.module);
  const { data, count } = await q;
  return { rows: (data as Obligation[]) ?? [], count: count ?? 0 };
}

export async function getActions(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("actions")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("due_date", { ascending: true, nullsFirst: false })
    .range(from, to);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  if (filters.status) q = q.eq("status", filters.status);
  const { data, count } = await q;
  return { rows: (data as ActionRow[]) ?? [], count: count ?? 0 };
}

export async function getDocuments(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("documents")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  const { data, count } = await q;
  return { rows: (data as DocumentRow[]) ?? [], count: count ?? 0 };
}

export async function getImportHistory(companyId: string): Promise<ImportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("imports")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as ImportRow[]) ?? [];
}

export async function getNotifications(profileId: string): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${profileId},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Notification[]) ?? [];
}

export async function getUnreadNotificationCount(profileId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .or(`user_id.eq.${profileId},user_id.is.null`)
    .eq("is_read", false);
  return count ?? 0;
}

export async function getProfiles(companyId: string): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", companyId)
    .order("last_name", { ascending: true });
  return (data as Profile[]) ?? [];
}

// --- Getters unitaires (pages détail) ---
export async function getObligation(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("obligations").select("*").eq("id", id).single();
  return data as Obligation | null;
}

export async function getVehicle(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select("*").eq("id", id).single();
  return data as Vehicle | null;
}

export async function getEmployee(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("employees").select("*").eq("id", id).single();
  return data as Employee | null;
}

export async function getEquipment(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("equipments").select("*").eq("id", id).single();
  return data as Equipment | null;
}

export async function getAction(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("actions").select("*").eq("id", id).single();
  return data as ActionRow | null;
}

export async function getDocument(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("documents").select("*").eq("id", id).single();
  return data as DocumentRow | null;
}

/** Documents/actions liés à une entité (pages détail). */
export async function getLinkedDocuments(column: string, id: string): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("documents").select("*").eq(column, id).eq("is_archived", false);
  return (data as DocumentRow[]) ?? [];
}

export async function getLinkedObligations(column: string, id: string): Promise<Obligation[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("obligations").select("*").eq(column, id).eq("is_archived", false);
  return (data as Obligation[]) ?? [];
}

export async function getObligationActions(obligationId: string): Promise<ActionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("actions").select("*").eq("obligation_id", obligationId);
  return (data as ActionRow[]) ?? [];
}
