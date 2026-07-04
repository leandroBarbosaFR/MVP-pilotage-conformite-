import { createClient } from "@/lib/supabase/server";
import type {
  ActionRow,
  DashboardStats,
  DocumentRow,
  ImportRow,
  Obligation,
} from "@/lib/types/database";

export async function getDashboardStats(companyId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_dashboard_stats", { p_company_id: companyId });
  return (data as DashboardStats) ?? emptyStats();
}

export async function getUpcomingObligations(companyId: string): Promise<Obligation[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("obligations")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .gte("due_date", today)
    .lte("due_date", in30)
    .order("due_date", { ascending: true })
    .limit(10);
  return (data as Obligation[]) ?? [];
}

export async function getOverdueActions(companyId: string): Promise<ActionRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("actions")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .neq("status", "DONE")
    .lt("due_date", today)
    .order("due_date", { ascending: true })
    .limit(10);
  return (data as ActionRow[]) ?? [];
}

/** Obligations actives sans document lié. */
export async function getMissingDocuments(companyId: string): Promise<Obligation[]> {
  const supabase = await createClient();
  const { data: obligations } = await supabase
    .from("obligations")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_archived", false);

  const { data: docs } = await supabase
    .from("documents")
    .select("obligation_id")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .not("obligation_id", "is", null);

  const withDoc = new Set((docs ?? []).map((d) => d.obligation_id));
  return ((obligations as Obligation[]) ?? []).filter((o) => !withDoc.has(o.id)).slice(0, 10);
}

export async function getExpiredDocuments(companyId: string): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .lt("expiration_date", today)
    .order("expiration_date", { ascending: true })
    .limit(10);
  return (data as DocumentRow[]) ?? [];
}

export async function getObligationsWithoutResponsible(companyId: string): Promise<Obligation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("obligations")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .is("responsible_id", null)
    .limit(10);
  return (data as Obligation[]) ?? [];
}

/** Actions à réaliser (non archivées, non terminées), triées par échéance. */
export async function getPendingActions(companyId: string): Promise<ActionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("actions")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .neq("status", "DONE")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(6);
  return (data as ActionRow[]) ?? [];
}

export async function getRecentDocuments(companyId: string): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data as DocumentRow[]) ?? [];
}

export async function getRecentImports(companyId: string): Promise<ImportRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("imports")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data as ImportRow[]) ?? [];
}

function emptyStats(): DashboardStats {
  return {
    stats: {
      obligations_ok: 0,
      obligations_soon: 0,
      obligations_expired: 0,
      obligations_total: 0,
      obligations_without_responsible: 0,
      missing_documents: 0,
    },
    overdue_actions: 0,
    pending_notifications: 0,
    expired_documents: 0,
  };
}
