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

export async function getExpiredObligations(companyId: string): Promise<Obligation[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("obligations")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .lt("due_date", today)
    .order("due_date", { ascending: true })
    .limit(10);
  return (data as Obligation[]) ?? [];
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

export interface ModulePriority {
  key: string;
  label: string;
  count: number;
  overdue: number;
  href: string;
}

/**
 * Comptes « à traiter » par module, pour le bloc « Priorités par module » du dashboard.
 * count = éléments dont l'échéance est proche (≤ 30 j) ou dépassée ; overdue = dépassés.
 * `extras` réutilise les valeurs déjà calculées côté dashboard (docs manquants, actions en retard).
 */
export async function getModulePriorities(
  companyId: string,
  extras: { missingDocs: number; overdueActions: number }
): Promise<ModulePriority[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const eqCol = { company_id: companyId, is_archived: false } as const;

  const [veh, certs, provs, contracts, equip, epis, absences, reminders] = await Promise.all([
    supabase.from("vehicles").select("technical_inspection_expiry, insurance_expiry, tachograph_expiry, extinguisher_expiry, next_maintenance").match(eqCol),
    supabase.from("employee_certifications").select("expiry_date, type").match(eqCol),
    supabase.from("providers").select("needs_followup, insurance_expiry").match(eqCol),
    supabase.from("contracts").select("status, renewal_date, end_date").match(eqCol),
    supabase.from("equipments").select("next_check_date").match(eqCol),
    supabase.from("epi").select("renewal_date").match(eqCol),
    supabase.from("employee_absences").select("next_medical_visit").match(eqCol),
    supabase.from("reminders").select("status").eq("company_id", companyId),
  ]);

  let remindersToDo = 0;
  for (const r of reminders.data ?? []) {
    if (r.status === "A_FAIRE" || r.status === "A_RELANCER") remindersToDo++;
  }

  const soon = (d: unknown) => typeof d === "string" && d <= in30; // inclut le passé
  const late = (d: unknown) => typeof d === "string" && d < today;

  let vehCount = 0, vehOverdue = 0;
  for (const v of veh.data ?? []) {
    const dates = [v.technical_inspection_expiry, v.insurance_expiry, v.tachograph_expiry, v.extinguisher_expiry, v.next_maintenance];
    if (dates.some(soon)) vehCount++;
    if (dates.some(late)) vehOverdue++;
  }

  let habCount = 0, habOverdue = 0, vmCount = 0, vmOverdue = 0;
  for (const c of certs.data ?? []) {
    const isVM = c.type === "MEDICAL_VISIT";
    if (soon(c.expiry_date)) isVM ? vmCount++ : habCount++;
    if (late(c.expiry_date)) isVM ? vmOverdue++ : habOverdue++;
  }
  for (const a of absences.data ?? []) {
    if (soon(a.next_medical_visit)) vmCount++;
    if (late(a.next_medical_visit)) vmOverdue++;
  }

  let provCount = 0, provOverdue = 0;
  for (const p of provs.data ?? []) {
    if (p.needs_followup || soon(p.insurance_expiry)) provCount++;
    if (late(p.insurance_expiry)) provOverdue++;
  }

  let ctrCount = 0, ctrOverdue = 0;
  for (const c of contracts.data ?? []) {
    const ref = c.renewal_date ?? c.end_date;
    if (c.status === "TO_RENEW" || c.status === "EXPIRED" || soon(ref)) ctrCount++;
    if (c.status === "EXPIRED" || late(ref)) ctrOverdue++;
  }

  let eqCount = 0, eqOverdue = 0;
  for (const e of equip.data ?? []) {
    if (soon(e.next_check_date)) eqCount++;
    if (late(e.next_check_date)) eqOverdue++;
  }

  let epiCount = 0, epiOverdue = 0;
  for (const e of epis.data ?? []) {
    if (soon(e.renewal_date)) epiCount++;
    if (late(e.renewal_date)) epiOverdue++;
  }

  return [
    { key: "vehicles", label: "Véhicules à contrôler", count: vehCount, overdue: vehOverdue, href: "/dashboard/vehicles" },
    { key: "hab", label: "Habilitations à renouveler", count: habCount, overdue: habOverdue, href: "/dashboard/employees/echeances" },
    { key: "missingdocs", label: "Documents manquants", count: extras.missingDocs, overdue: 0, href: "/dashboard/documents?view=missing" },
    { key: "providers", label: "Prestataires à relancer", count: provCount, overdue: provOverdue, href: "/dashboard/providers?followup=1" },
    { key: "contracts", label: "Contrats à renouveler", count: ctrCount, overdue: ctrOverdue, href: "/dashboard/contracts?status=TO_RENEW" },
    { key: "equipments", label: "Équipements à vérifier", count: eqCount, overdue: eqOverdue, href: "/dashboard/equipments" },
    { key: "epi", label: "EPI à renouveler", count: epiCount, overdue: epiOverdue, href: "/dashboard/epi" },
    { key: "vm", label: "Visites médicales à planifier", count: vmCount, overdue: vmOverdue, href: "/dashboard/employees/echeances?type=MEDICAL_VISIT" },
    { key: "actions", label: "Actions en retard", count: extras.overdueActions, overdue: extras.overdueActions, href: "/dashboard/actions" },
    { key: "reminders", label: "Relances à faire", count: remindersToDo, overdue: 0, href: "/dashboard/relances" },
  ];
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

/** Incidents non clôturés (pour le rapport). */
export async function getOpenIncidents(companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select("id, title, occurred_at, status")
    .eq("company_id", companyId)
    .eq("is_archived", false)
    .not("status", "in", "(CLOSED,ARCHIVED)")
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .limit(20);
  return (data as { id: string; title: string; occurred_at: string | null; status: string }[]) ?? [];
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
