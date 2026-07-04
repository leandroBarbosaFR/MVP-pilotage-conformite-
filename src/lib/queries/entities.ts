import { createClient } from "@/lib/supabase/server";
import type {
  ActionRow,
  DocumentRow,
  Employee,
  Epi,
  Equipment,
  ImportRow,
  Notification,
  Obligation,
  Profile,
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
