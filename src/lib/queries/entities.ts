import { createClient } from "@/lib/supabase/server";
import type {
  ActionRow,
  Audit,
  Contract,
  DocumentRow,
  Employee,
  EmployeeAbsence,
  EmployeeCertification,
  Epi,
  Equipment,
  ImportRow,
  Incident,
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
  site?: string;
  contractType?: string;
  followup?: boolean;
  responsible?: string;
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
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.site) q = q.eq("site_id", filters.site);
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
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.site) q = q.eq("site_id", filters.site);
  if (filters.contractType) q = q.eq("contract_type", filters.contractType);
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
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.site) q = q.eq("site_id", filters.site);
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
  if (filters.site) q = q.eq("site_id", filters.site);
  if (filters.followup) q = q.eq("needs_followup", true);
  const { data, count } = await q;
  return { rows: (data as Provider[]) ?? [], count: count ?? 0 };
}

export async function getProviderDetail(id: string) {
  const supabase = await createClient();
  const provRes = await supabase.from("providers").select("*").eq("id", id).single();
  const provider = (provRes.data as Provider) ?? null;
  const empty = {
    provider,
    contracts: [] as Contract[],
    obligations: [] as Obligation[],
    documents: [] as DocumentRow[],
    actions: [] as ActionRow[],
    siteName: null as string | null,
    profileName: new Map<string, string>(),
  };
  if (!provider) return empty;
  const companyId = provider.company_id;

  const [ctrRes, oblRes, docRes, actRes, profRes, siteRes] = await Promise.all([
    supabase.from("contracts").select("*").eq("provider_id", id).eq("is_archived", false),
    supabase.from("obligations").select("*").eq("provider_id", id).eq("is_archived", false),
    supabase.from("documents").select("*").eq("provider_id", id).eq("is_archived", false),
    supabase.from("actions").select("*").eq("related_entity_type", "PROVIDER").eq("related_entity_id", id).eq("is_archived", false).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("profiles").select("id, first_name, last_name, email").eq("company_id", companyId),
    provider.site_id
      ? supabase.from("sites").select("name").eq("id", provider.site_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const profileName = new Map<string, string>();
  for (const p of profRes.data ?? [])
    profileName.set(p.id as string, [p.first_name, p.last_name].filter(Boolean).join(" ") || (p.email as string) || "—");

  return {
    provider,
    contracts: (ctrRes.data as Contract[]) ?? [],
    obligations: (oblRes.data as Obligation[]) ?? [],
    documents: (docRes.data as DocumentRow[]) ?? [],
    actions: (actRes.data as ActionRow[]) ?? [],
    siteName: (siteRes.data as { name: string } | null)?.name ?? null,
    profileName,
  };
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

export async function getContractDetail(id: string) {
  const supabase = await createClient();
  const cRes = await supabase.from("contracts").select("*").eq("id", id).single();
  const contract = (cRes.data as Contract) ?? null;
  const empty = {
    contract,
    provider: null as { id: string; name: string } | null,
    site: null as { id: string; name: string } | null,
    document: null as DocumentRow | null,
    profileName: new Map<string, string>(),
  };
  if (!contract) return empty;
  const companyId = contract.company_id;

  const [provRes, siteRes, profRes, docRes] = await Promise.all([
    contract.provider_id
      ? supabase.from("providers").select("id, name").eq("id", contract.provider_id).single()
      : Promise.resolve({ data: null }),
    contract.site_id
      ? supabase.from("sites").select("id, name").eq("id", contract.site_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("id, first_name, last_name, email").eq("company_id", companyId),
    contract.document_id
      ? supabase.from("documents").select("*").eq("id", contract.document_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const profileName = new Map<string, string>();
  for (const p of profRes.data ?? [])
    profileName.set(p.id as string, [p.first_name, p.last_name].filter(Boolean).join(" ") || (p.email as string) || "—");

  return {
    contract,
    provider: (provRes.data as { id: string; name: string } | null) ?? null,
    site: (siteRes.data as { id: string; name: string } | null) ?? null,
    document: (docRes.data as DocumentRow | null) ?? null,
    profileName,
  };
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

export async function getIncidents(companyId: string, filters: ListFilters = {}) {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("incidents")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .range(from, to);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.category) q = q.eq("type", filters.category);
  const { data, count } = await q;
  return { rows: (data as Incident[]) ?? [], count: count ?? 0 };
}

export async function getIncidentDetail(id: string) {
  const supabase = await createClient();
  const incRes = await supabase.from("incidents").select("*").eq("id", id).single();
  const incident = (incRes.data as Incident) ?? null;
  const empty = {
    incident,
    siteName: null as string | null,
    correctiveAction: null as ActionRow | null,
    profileName: new Map<string, string>(),
    relatedName: null as string | null,
  };
  if (!incident) return empty;
  const companyId = incident.company_id;

  const [profRes, siteRes, actRes] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, email").eq("company_id", companyId),
    incident.site_id
      ? supabase.from("sites").select("name").eq("id", incident.site_id).single()
      : Promise.resolve({ data: null }),
    incident.corrective_action_id
      ? supabase.from("actions").select("*").eq("id", incident.corrective_action_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const profileName = new Map<string, string>();
  for (const p of profRes.data ?? [])
    profileName.set(p.id as string, [p.first_name, p.last_name].filter(Boolean).join(" ") || (p.email as string) || "—");

  let relatedName: string | null = null;
  if (incident.related_entity_id && incident.related_entity_type !== "SITE") {
    const map = await getEntityNameMap(companyId);
    relatedName = map.get(incident.related_entity_id) ?? null;
  }

  return {
    incident,
    siteName: (siteRes.data as { name: string } | null)?.name ?? null,
    correctiveAction: (actRes.data as ActionRow | null) ?? null,
    profileName,
    relatedName,
  };
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

export interface DocumentLink {
  label: string;
  module: string;
}

/**
 * Résout, pour chaque document, l'entité à laquelle il est rattaché — via ses
 * colonnes de liaison directes (site, prestataire, contrat, audit, incident,
 * non-conformité, certification, véhicule, salarié, équipement, EPI) ou via son
 * obligation. Retourne Map<documentId, { label, module }>.
 */
export async function getDocumentLinkMap(
  companyId: string,
  docs: DocumentRow[]
): Promise<Map<string, DocumentLink>> {
  const supabase = await createClient();
  const [veh, emp, eqp, epis, sites, prov, ctr, aud, inc, ncs, certs, obl] = await Promise.all([
    supabase.from("vehicles").select("id, registration_number").eq("company_id", companyId),
    supabase.from("employees").select("id, first_name, last_name").eq("company_id", companyId),
    supabase.from("equipments").select("id, name").eq("company_id", companyId),
    supabase.from("epi").select("id, epi_type").eq("company_id", companyId),
    supabase.from("sites").select("id, name").eq("company_id", companyId),
    supabase.from("providers").select("id, name").eq("company_id", companyId),
    supabase.from("contracts").select("id, title, document_id").eq("company_id", companyId),
    supabase.from("audits").select("id, title").eq("company_id", companyId),
    supabase.from("incidents").select("id, title").eq("company_id", companyId),
    supabase.from("non_conformities").select("id, title").eq("company_id", companyId),
    supabase.from("employee_certifications").select("id, title").eq("company_id", companyId),
    supabase.from("obligations").select("id, title, related_entity_type, related_entity_id").eq("company_id", companyId),
  ]);

  const names = new Map<string, string>();
  for (const v of veh.data ?? []) names.set(v.id as string, v.registration_number as string);
  for (const e of emp.data ?? []) names.set(e.id as string, [e.first_name, e.last_name].filter(Boolean).join(" "));
  for (const q of eqp.data ?? []) names.set(q.id as string, q.name as string);
  for (const e of epis.data ?? []) names.set(e.id as string, e.epi_type as string);
  for (const s of sites.data ?? []) names.set(s.id as string, s.name as string);
  for (const p of prov.data ?? []) names.set(p.id as string, p.name as string);
  for (const a of aud.data ?? []) names.set(a.id as string, a.title as string);
  for (const i of inc.data ?? []) names.set(i.id as string, i.title as string);
  for (const n of ncs.data ?? []) names.set(n.id as string, n.title as string);
  for (const c of certs.data ?? []) names.set(c.id as string, c.title as string);

  const oblById = new Map<string, { title: string; ret: string | null; rid: string | null }>();
  for (const o of obl.data ?? [])
    oblById.set(o.id as string, {
      title: o.title as string,
      ret: (o.related_entity_type as string) ?? null,
      rid: (o.related_entity_id as string) ?? null,
    });

  // Contrats rattachés via contracts.document_id (relation inverse)
  const contractByDoc = new Map<string, string>();
  for (const c of ctr.data ?? [])
    if (c.document_id) contractByDoc.set(c.document_id as string, c.title as string);

  const PREFIX: Record<string, string> = {
    VEHICLE: "Véhicule", EMPLOYEE: "Salarié", DRIVER: "Conducteur",
    EQUIPMENT: "Équipement", SITE: "Site", PPE: "EPI",
  };
  const n = (id: string | null) => (id ? names.get(id) ?? "" : "");

  const result = new Map<string, DocumentLink>();
  for (const d of docs) {
    let link: DocumentLink = { label: "—", module: "—" };
    if (d.site_id) link = { label: `Site ${n(d.site_id)}`.trim(), module: "Sites" };
    else if (d.provider_id) link = { label: `Prestataire ${n(d.provider_id)}`.trim(), module: "Prestataires" };
    else if (d.contract_id) link = { label: `Contrat ${n(d.contract_id)}`.trim(), module: "Contrats" };
    else if (contractByDoc.has(d.id)) link = { label: `Contrat ${contractByDoc.get(d.id)}`, module: "Contrats" };
    else if (d.audit_id) link = { label: `Audit ${n(d.audit_id)}`.trim(), module: "Audits" };
    else if (d.incident_id) link = { label: `Incident ${n(d.incident_id)}`.trim(), module: "Incidents" };
    else if (d.non_conformity_id) link = { label: `Non-conformité ${n(d.non_conformity_id)}`.trim(), module: "Non-conformités" };
    else if (d.certification_id) link = { label: `Habilitation ${n(d.certification_id)}`.trim(), module: "Personnel" };
    else if (d.vehicle_id) link = { label: `Véhicule ${n(d.vehicle_id)}`.trim(), module: "Véhicules" };
    else if (d.employee_id) link = { label: `Salarié ${n(d.employee_id)}`.trim(), module: "Personnel" };
    else if (d.equipment_id) link = { label: `Équipement ${n(d.equipment_id)}`.trim(), module: "Équipements" };
    else if (d.epi_id) link = { label: `EPI ${n(d.epi_id)}`.trim(), module: "EPI" };
    else if (d.obligation_id) {
      const o = oblById.get(d.obligation_id);
      if (o?.rid && names.has(o.rid)) link = { label: `${PREFIX[o.ret ?? ""] ?? "Élément"} ${names.get(o.rid)}`, module: "Contrôles" };
      else if (o) link = { label: `Obligation : ${o.title}`, module: "Contrôles" };
    }
    result.set(d.id, link);
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

export interface SiteHistoryEvent {
  date: string | null;
  type: string;
  description: string;
}

export async function getSiteDetail(id: string) {
  const supabase = await createClient();
  const siteRes = await supabase.from("sites").select("*").eq("id", id).single();
  const site = (siteRes.data as Site) ?? null;

  const empty = {
    site,
    obligations: [] as Obligation[],
    contracts: [] as Contract[],
    audits: [] as Audit[],
    documents: [] as DocumentRow[],
    providers: [] as Provider[],
    actions: [] as ActionRow[],
    nonConformities: [] as NonPilotix[],
    incidents: [] as Incident[],
    providerName: new Map<string, string>(),
    profileName: new Map<string, string>(),
    docByObligation: new Set<string>(),
    history: [] as SiteHistoryEvent[],
  };
  if (!site) return empty;
  const companyId = site.company_id;

  const [oblRes, ctrRes, audRes, docRes, ncRes, incRes, actRes, provRes, profRes] = await Promise.all([
    supabase.from("obligations").select("*").eq("related_entity_id", id).eq("related_entity_type", "SITE").eq("is_archived", false).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("contracts").select("*").eq("site_id", id).eq("is_archived", false),
    supabase.from("audits").select("*").eq("site_id", id).eq("is_archived", false),
    supabase.from("documents").select("*").eq("site_id", id).eq("is_archived", false),
    supabase.from("non_conformities").select("*").eq("site_id", id).eq("is_archived", false),
    supabase.from("incidents").select("*").eq("site_id", id).eq("is_archived", false),
    supabase.from("actions").select("*").eq("related_entity_type", "SITE").eq("related_entity_id", id).eq("is_archived", false),
    supabase.from("providers").select("*").eq("company_id", companyId).eq("is_archived", false),
    supabase.from("profiles").select("id, first_name, last_name, email").eq("company_id", companyId),
  ]);

  const obligations = (oblRes.data as Obligation[]) ?? [];
  const contracts = (ctrRes.data as Contract[]) ?? [];
  const audits = (audRes.data as Audit[]) ?? [];
  const documents = (docRes.data as DocumentRow[]) ?? [];
  const nonConformities = (ncRes.data as NonPilotix[]) ?? [];
  const incidents = (incRes.data as Incident[]) ?? [];
  const actions = (actRes.data as ActionRow[]) ?? [];
  const allProviders = (provRes.data as Provider[]) ?? [];

  // Documents rattachés via les obligations du site (en plus des directs)
  const oblIds = obligations.map((o) => o.id);
  const docByObligation = new Set<string>();
  if (oblIds.length > 0) {
    const { data: oblDocs } = await supabase
      .from("documents").select("*").in("obligation_id", oblIds).eq("is_archived", false);
    const seen = new Set(documents.map((d) => d.id));
    for (const d of (oblDocs as DocumentRow[]) ?? []) {
      if (d.obligation_id) docByObligation.add(d.obligation_id);
      if (!seen.has(d.id)) { documents.push(d); seen.add(d.id); }
    }
  }

  // Prestataires liés : rattachement direct (site_id) ou via un contrat du site
  const contractProviderIds = new Set(contracts.map((c) => c.provider_id).filter(Boolean) as string[]);
  const providers = allProviders.filter((p) => p.site_id === id || contractProviderIds.has(p.id));

  const providerName = new Map<string, string>();
  for (const p of allProviders) providerName.set(p.id, p.name);
  const profileName = new Map<string, string>();
  for (const p of profRes.data ?? [])
    profileName.set(p.id as string, [p.first_name, p.last_name].filter(Boolean).join(" ") || (p.email as string) || "—");

  // Historique synthétisé à partir des éléments rattachés
  const history: SiteHistoryEvent[] = [{ date: site.created_at, type: "Site créé", description: site.name }];
  for (const o of obligations) history.push({ date: o.created_at, type: "Obligation créée", description: o.title });
  for (const d of documents) history.push({ date: d.created_at, type: "Document ajouté", description: d.title });
  for (const c of contracts) history.push({ date: c.created_at, type: "Contrat ajouté", description: c.title });
  for (const a of audits) history.push({ date: a.created_at, type: "Audit planifié", description: a.title });
  for (const a of actions) history.push({ date: a.created_at, type: "Action créée", description: a.title });
  for (const n of nonConformities) history.push({ date: n.created_at, type: "Non-conformité", description: n.title });
  for (const i of incidents) history.push({ date: i.created_at, type: "Incident", description: i.title });
  history.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return {
    site, obligations, contracts, audits, documents, providers, actions,
    nonConformities, incidents, providerName, profileName, docByObligation,
    history: history.slice(0, 30),
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

/** Colonne de liaison document -> module (pour filtrer « par module »). */
const DOC_MODULE_COLUMN: Record<string, string> = {
  sites: "site_id",
  providers: "provider_id",
  contracts: "contract_id",
  audits: "audit_id",
  incidents: "incident_id",
  non_conformities: "non_conformity_id",
  personnel: "employee_id",
  vehicles: "vehicle_id",
  equipments: "equipment_id",
  epi: "epi_id",
  controls: "obligation_id",
};

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
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.category) q = q.eq("document_type", filters.category);
  if (filters.site) q = q.eq("site_id", filters.site);
  if (filters.responsible) q = q.eq("responsible_id", filters.responsible);
  if (filters.module && DOC_MODULE_COLUMN[filters.module])
    q = q.not(DOC_MODULE_COLUMN[filters.module], "is", null);
  const { data, count } = await q;
  return { rows: (data as DocumentRow[]) ?? [], count: count ?? 0 };
}

/** Obligations actives dont le document attendu est absent (vue « Documents manquants »). */
export async function getMissingDocumentObligations(
  companyId: string,
  filters: ListFilters = {}
): Promise<{ rows: Obligation[]; count: number }> {
  const supabase = await createClient();
  const [oblRes, docRes] = await Promise.all([
    supabase.from("obligations").select("*").eq("company_id", companyId).eq("is_archived", false).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("documents").select("obligation_id").eq("company_id", companyId).eq("is_archived", false).not("obligation_id", "is", null),
  ]);
  const withDoc = new Set((docRes.data ?? []).map((d) => d.obligation_id));
  let rows = ((oblRes.data as Obligation[]) ?? []).filter((o) => !withDoc.has(o.id));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((o) => (o.expected_document ?? o.title).toLowerCase().includes(q) || o.title.toLowerCase().includes(q));
  }
  const count = rows.length;
  const page = filters.page ?? 1;
  const size = filters.pageSize ?? 20;
  rows = rows.slice((page - 1) * size, (page - 1) * size + size);
  return { rows, count };
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

/** Actions rattachées à une entité via related_entity_type/related_entity_id. */
export async function getEntityActions(relatedType: string, id: string): Promise<ActionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("actions")
    .select("*")
    .eq("related_entity_type", relatedType)
    .eq("related_entity_id", id)
    .eq("is_archived", false)
    .order("due_date", { ascending: true, nullsFirst: false });
  return (data as ActionRow[]) ?? [];
}

/** Incidents rattachés à une entité via related_entity_type/related_entity_id. */
export async function getEntityIncidents(relatedType: string, id: string): Promise<Incident[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select("*")
    .eq("related_entity_type", relatedType)
    .eq("related_entity_id", id)
    .eq("is_archived", false)
    .order("occurred_at", { ascending: false, nullsFirst: false });
  return (data as Incident[]) ?? [];
}

// --- Personnel : certifications & absences (migration 0008) ------------

/** Liste id + nom des sites (pour selects et cartographie nom). */
export async function getSiteOptions(companyId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .order("name", { ascending: true });
  return (data as { id: string; name: string }[]) ?? [];
}

export async function getEmployeeCertifications(employeeId: string): Promise<EmployeeCertification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_certifications")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("is_archived", false)
    .order("expiry_date", { ascending: true, nullsFirst: false });
  return (data as EmployeeCertification[]) ?? [];
}

export async function getEmployeeAbsences(employeeId: string): Promise<EmployeeAbsence[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_absences")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("is_archived", false)
    .order("start_date", { ascending: false, nullsFirst: false });
  return (data as EmployeeAbsence[]) ?? [];
}

/** EPI attribués à un salarié (table epi, assigned_employee_id). */
export async function getEmployeeEpi(employeeId: string): Promise<Epi[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("epi")
    .select("*")
    .eq("assigned_employee_id", employeeId)
    .eq("is_archived", false)
    .order("renewal_date", { ascending: true, nullsFirst: false });
  return (data as Epi[]) ?? [];
}

export interface CertSummary {
  status: "ok" | "warn" | "danger" | "none";
  nextDue: string | null;
  expiring: number;
  expired: number;
  total: number;
}

/** Résumé des certifications par salarié : pire statut, prochaine échéance, compteurs. */
export async function getCertSummaryMap(companyId: string): Promise<Map<string, CertSummary>> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("employee_certifications")
    .select("employee_id, expiry_date")
    .eq("company_id", companyId)
    .eq("is_archived", false);
  const map = new Map<string, CertSummary>();
  for (const c of (data as { employee_id: string; expiry_date: string | null }[]) ?? []) {
    const cur = map.get(c.employee_id) ?? { status: "none", nextDue: null, expiring: 0, expired: 0, total: 0 };
    cur.total += 1;
    const bucket = !c.expiry_date ? "none" : c.expiry_date < today ? "danger" : c.expiry_date <= in30 ? "warn" : "ok";
    if (TONE_RANK[bucket] > TONE_RANK[cur.status]) cur.status = bucket as CertSummary["status"];
    if (c.expiry_date && (!cur.nextDue || c.expiry_date < cur.nextDue)) cur.nextDue = c.expiry_date;
    if (bucket === "danger") cur.expired += 1;
    else if (bucket === "warn") cur.expiring += 1;
    map.set(c.employee_id, cur);
  }
  return map;
}

export interface PersonnelDeadline {
  cert: EmployeeCertification;
  employeeName: string;
  jobTitle: string | null;
  siteName: string | null;
}

/** Vue consolidée « Échéances du personnel » : certifications + salarié + site. */
export async function getPersonnelDeadlines(
  companyId: string,
  filters: ListFilters = {}
): Promise<{ rows: PersonnelDeadline[]; count: number }> {
  const supabase = await createClient();
  const { from, to } = range(filters.page, filters.pageSize);
  let q = supabase
    .from("employee_certifications")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_archived", filters.includeArchived ?? false)
    .order("expiry_date", { ascending: true, nullsFirst: false })
    .range(from, to);
  if (filters.search) q = q.ilike("title", `%${filters.search}%`);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.category) q = q.eq("type", filters.category);
  const { data, count } = await q;
  const certs = (data as EmployeeCertification[]) ?? [];

  const [emps, sites] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, job_title, site_id").eq("company_id", companyId),
    supabase.from("sites").select("id, name").eq("company_id", companyId),
  ]);
  const empMap = new Map<string, { name: string; job: string | null; site_id: string | null }>();
  for (const e of emps.data ?? [])
    empMap.set(e.id as string, {
      name: [e.first_name, e.last_name].filter(Boolean).join(" "),
      job: (e.job_title as string) ?? null,
      site_id: (e.site_id as string) ?? null,
    });
  const siteMap = new Map<string, string>();
  for (const s of sites.data ?? []) siteMap.set(s.id as string, s.name as string);

  const rows = certs.map((c) => {
    const e = empMap.get(c.employee_id);
    return {
      cert: c,
      employeeName: e?.name ?? "—",
      jobTitle: e?.job ?? null,
      siteName: e?.site_id ? siteMap.get(e.site_id) ?? null : null,
    };
  });
  return { rows, count: count ?? rows.length };
}
