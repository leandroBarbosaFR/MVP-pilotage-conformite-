// =====================================================================
// Fonctions de lecture principales, mises en cache par rendu (React cache()).
// Toutes filtrent implicitement par tenant (company_id) via le profil courant.
// =====================================================================

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/queries/auth";
import { getDashboardStats as getStatsByCompany } from "@/lib/queries/dashboard";
import type {
  ActionRow,
  Company,
  Notification,
  NotificationSettings,
  Obligation,
  Profile,
} from "@/lib/types/database";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  return (await getCurrentContext())?.profile ?? null;
});

export const getCurrentTenant = cache(async (): Promise<Company | null> => {
  return (await getCurrentContext())?.company ?? null;
});

export const getDashboardStats = cache(async () => {
  const ctx = await getCurrentContext();
  if (!ctx) return null;
  return getStatsByCompany(ctx.company.id);
});

/** Tous les profils du tenant (utilisateurs et membres invités). */
export const getUsersByTenant = cache(async (): Promise<Profile[]> => {
  const ctx = await getCurrentContext();
  if (!ctx) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", ctx.company.id)
    .order("last_name", { ascending: true });
  return (data as Profile[]) ?? [];
});

/** Profils actifs, assignables comme responsable / superviseur. */
export const getAssignableUsers = cache(async (): Promise<Profile[]> => {
  return (await getUsersByTenant()).filter((p) => p.is_active);
});

export interface ModuleStat {
  module: string;
  total: number;
  compliant: number;
  toWatch: number;
  critical: number;
  missingDocs: number;
  lateActions: number;
}

type Bucket = "ok" | "watch" | "critical" | null;

function bucketOf(date: string | null | undefined): Bucket {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "critical";
  if (days <= 30) return "watch";
  return "ok";
}

function worst(buckets: Bucket[]): Bucket {
  if (buckets.includes("critical")) return "critical";
  if (buckets.includes("watch")) return "watch";
  if (buckets.includes("ok")) return "ok";
  return null;
}

/** Répartition de conformité par module (calcul en mémoire, filtré par tenant). */
export const getModuleBreakdown = cache(async (): Promise<ModuleStat[]> => {
  const ctx = await getCurrentContext();
  if (!ctx) return [];
  const supabase = await createClient();
  const cid = ctx.company.id;
  const active = { company_id: cid, is_archived: false };

  const [emp, eqp, veh, epi, obl, doc, act] = await Promise.all([
    supabase.from("employees").select("id").match(active),
    supabase.from("equipments").select("id").match(active),
    supabase.from("vehicles").select("id").match(active),
    supabase.from("epi").select("id, renewal_date").match(active),
    supabase.from("obligations").select("id, due_date, linked_employee_id, linked_equipment_id, linked_vehicle_id").match(active),
    supabase.from("documents").select("obligation_id, employee_id, equipment_id, vehicle_id, epi_id, expiration_date").match(active),
    supabase.from("actions").select("status, due_date, obligation_id").match(active),
  ]);

  const employees = emp.data ?? [];
  const equipments = eqp.data ?? [];
  const vehicles = veh.data ?? [];
  const epis = epi.data ?? [];
  const obligations = obl.data ?? [];
  const documents = doc.data ?? [];
  const actions = act.data ?? [];

  // Obligations liées par entité
  const oblByEmployee = new Map<string, Bucket[]>();
  const oblByEquipment = new Map<string, Bucket[]>();
  const oblByVehicle = new Map<string, Bucket[]>();
  const oblById = new Map<string, { emp?: string; eqp?: string; veh?: string }>();
  for (const o of obligations) {
    const b = bucketOf(o.due_date as string | null);
    oblById.set(o.id as string, {
      emp: (o.linked_employee_id as string) ?? undefined,
      eqp: (o.linked_equipment_id as string) ?? undefined,
      veh: (o.linked_vehicle_id as string) ?? undefined,
    });
    if (o.linked_employee_id) oblByEmployee.set(o.linked_employee_id as string, [...(oblByEmployee.get(o.linked_employee_id as string) ?? []), b]);
    if (o.linked_equipment_id) oblByEquipment.set(o.linked_equipment_id as string, [...(oblByEquipment.get(o.linked_equipment_id as string) ?? []), b]);
    if (o.linked_vehicle_id) oblByVehicle.set(o.linked_vehicle_id as string, [...(oblByVehicle.get(o.linked_vehicle_id as string) ?? []), b]);
  }

  // Documents présents par entité / obligation
  const docEmp = new Set(documents.map((d) => d.employee_id).filter(Boolean) as string[]);
  const docEqp = new Set(documents.map((d) => d.equipment_id).filter(Boolean) as string[]);
  const docVeh = new Set(documents.map((d) => d.vehicle_id).filter(Boolean) as string[]);
  const docEpi = new Set(documents.map((d) => d.epi_id).filter(Boolean) as string[]);
  const docObl = new Set(documents.map((d) => d.obligation_id).filter(Boolean) as string[]);

  // Actions en retard attribuées au module de leur obligation liée (sinon contrôles)
  const lateActions = { personnel: 0, epi: 0, equipments: 0, vehicles: 0, controls: 0, documents: 0 };
  for (const a of actions) {
    if (a.status === "DONE" || a.status === "CANCELLED" || a.status === "ARCHIVED") continue;
    if (bucketOf(a.due_date as string | null) !== "critical") continue; // en retard
    const link = a.obligation_id ? oblById.get(a.obligation_id as string) : undefined;
    if (link?.emp) lateActions.personnel += 1;
    else if (link?.eqp) lateActions.equipments += 1;
    else if (link?.veh) lateActions.vehicles += 1;
    else lateActions.controls += 1;
  }

  const fromEntities = (
    ids: string[],
    linkMap: Map<string, Bucket[]>,
    docSet: Set<string>
  ) => {
    let compliant = 0, toWatch = 0, critical = 0, missingDocs = 0;
    for (const id of ids) {
      const w = worst(linkMap.get(id) ?? []);
      if (w === "critical") critical += 1;
      else if (w === "watch") toWatch += 1;
      else compliant += 1; // ok ou sans obligation liée
      if (!docSet.has(id)) missingDocs += 1;
    }
    return { compliant, toWatch, critical, missingDocs };
  };

  const fromDates = (dates: (string | null)[]) => {
    let compliant = 0, toWatch = 0, critical = 0;
    for (const dt of dates) {
      const b = bucketOf(dt);
      if (b === "critical") critical += 1;
      else if (b === "watch") toWatch += 1;
      else compliant += 1;
    }
    return { compliant, toWatch, critical };
  };

  const empStat = fromEntities(employees.map((e) => e.id as string), oblByEmployee, docEmp);
  const eqpStat = fromEntities(equipments.map((e) => e.id as string), oblByEquipment, docEqp);
  const vehStat = fromEntities(vehicles.map((v) => v.id as string), oblByVehicle, docVeh);
  const epiStat = fromDates(epis.map((e) => e.renewal_date as string | null));
  const oblStat = fromDates(obligations.map((o) => o.due_date as string | null));
  const docStat = fromDates(documents.map((d) => d.expiration_date as string | null));

  return [
    { module: "Personnel", total: employees.length, ...empStat, lateActions: lateActions.personnel },
    { module: "EPI", total: epis.length, ...epiStat, missingDocs: epis.filter((e) => !docEpi.has(e.id as string)).length, lateActions: lateActions.epi },
    { module: "Machines et équipements", total: equipments.length, ...eqpStat, lateActions: lateActions.equipments },
    { module: "Véhicules", total: vehicles.length, ...vehStat, lateActions: lateActions.vehicles },
    { module: "Contrôles réglementaires", total: obligations.length, ...oblStat, missingDocs: obligations.filter((o) => !docObl.has(o.id as string)).length, lateActions: lateActions.controls },
    { module: "Documents", total: documents.length, ...docStat, missingDocs: 0, lateActions: lateActions.documents },
  ];
});

/** Réglages de notifications du tenant (null si non initialisés). */
export const getNotificationSettings = cache(async (): Promise<NotificationSettings | null> => {
  const ctx = await getCurrentContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("tenant_id", ctx.company.id)
    .maybeSingle();
  return (data as NotificationSettings) ?? null;
});

/** Actions assignées à l'utilisateur courant (non archivées). */
export const getMyActions = cache(async (): Promise<ActionRow[]> => {
  const ctx = await getCurrentContext();
  if (!ctx) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("actions")
    .select("*")
    .eq("company_id", ctx.company.id)
    .eq("assigned_to", ctx.profile.id)
    .eq("is_archived", false)
    .order("due_date", { ascending: true, nullsFirst: false });
  return (data as ActionRow[]) ?? [];
});

/** Notifications de l'utilisateur courant (ou du tenant si user_id null). */
export const getMyNotifications = cache(async (): Promise<Notification[]> => {
  const ctx = await getCurrentContext();
  if (!ctx) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${ctx.profile.id},user_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Notification[]) ?? [];
});

/** Échéances à venir (obligations sous 30 jours). */
export const getUpcomingDeadlines = cache(async (): Promise<Obligation[]> => {
  const ctx = await getCurrentContext();
  if (!ctx) return [];
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("obligations")
    .select("*")
    .eq("company_id", ctx.company.id)
    .eq("is_archived", false)
    .gte("due_date", today)
    .lte("due_date", in30)
    .order("due_date", { ascending: true })
    .limit(20);
  return (data as Obligation[]) ?? [];
});

/** Alertes critiques (obligations dont l'échéance est dépassée). */
export const getCriticalAlerts = cache(async (): Promise<Obligation[]> => {
  const ctx = await getCurrentContext();
  if (!ctx) return [];
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("obligations")
    .select("*")
    .eq("company_id", ctx.company.id)
    .eq("is_archived", false)
    .lt("due_date", today)
    .order("due_date", { ascending: true })
    .limit(20);
  return (data as Obligation[]) ?? [];
});
