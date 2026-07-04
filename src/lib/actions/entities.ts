"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/queries/auth";

const ARCHIVABLE = new Set([
  "vehicles",
  "employees",
  "equipments",
  "epi",
  "obligations",
  "documents",
  "actions",
]);

function s(v: FormDataEntryValue | null): string | null {
  const str = String(v ?? "").trim();
  return str === "" ? null : str;
}

/** Archive / désarchive un enregistrement (aucune suppression définitive). */
export async function toggleArchive(table: string, id: string, archive = true) {
  if (!ARCHIVABLE.has(table)) throw new Error("Table non autorisée");
  const { profile } = await requireContext();
  const supabase = await createClient();
  await supabase
    .from(table)
    .update({
      is_archived: archive,
      archived_at: archive ? new Date().toISOString() : null,
      archived_by: archive ? profile.id : null,
    })
    .eq("id", id);
  revalidatePath(`/dashboard/${table}`);
  revalidatePath("/dashboard");
}

export async function createObligation(formData: FormData) {
  const { company } = await requireContext();
  const supabase = await createClient();
  await supabase.from("obligations").insert({
    company_id: company.id,
    title: s(formData.get("title")) ?? "Sans titre",
    category: s(formData.get("category")) ?? "autre",
    module: s(formData.get("module")) ?? "REGULATORY_CONTROLS",
    related_entity_type: s(formData.get("related_entity_type")),
    related_entity_id: s(formData.get("related_entity_id")),
    description: s(formData.get("description")),
    notes: s(formData.get("notes")),
    due_date: s(formData.get("due_date")),
    frequency: s(formData.get("frequency")) ?? "unique",
    priority: s(formData.get("priority")) ?? "MEDIUM",
    status: s(formData.get("status")) ?? "COMPLIANT",
    responsible_id: s(formData.get("responsible_id")),
    supervisor_id: s(formData.get("supervisor_id")),
    linked_vehicle_id: s(formData.get("linked_vehicle_id")),
    linked_employee_id: s(formData.get("linked_employee_id")),
    linked_equipment_id: s(formData.get("linked_equipment_id")),
    comments: s(formData.get("comments")),
  });
  revalidatePath("/dashboard/obligations");
  revalidatePath("/dashboard");
}

export async function createAction(formData: FormData) {
  const { company, profile } = await requireContext();
  const supabase = await createClient();
  await supabase.from("actions").insert({
    company_id: company.id,
    title: s(formData.get("title")) ?? "Sans titre",
    description: s(formData.get("description")),
    category: s(formData.get("category")),
    status: s(formData.get("status")) ?? "TODO",
    priority: s(formData.get("priority")) ?? "MEDIUM",
    due_date: s(formData.get("due_date")),
    assigned_to: s(formData.get("assigned_to")),
    supervisor_id: s(formData.get("supervisor_id")),
    obligation_id: s(formData.get("obligation_id")),
    comment: s(formData.get("comment")),
    created_by: profile.id,
  });
  revalidatePath("/dashboard/actions");
  revalidatePath("/dashboard");
}

export async function updateActionStatus(id: string, status: string) {
  const { profile } = await requireContext();
  const supabase = await createClient();
  const done = status === "DONE";
  await supabase
    .from("actions")
    .update({
      status,
      completed_at: done ? new Date().toISOString() : null,
      completed_by: done ? profile.id : null,
    })
    .eq("id", id);
  revalidatePath("/dashboard/actions");
  revalidatePath(`/dashboard/actions/${id}`);
  revalidatePath("/dashboard");
}

export async function createVehicle(formData: FormData) {
  const { company } = await requireContext();
  const supabase = await createClient();
  await supabase.from("vehicles").insert({
    company_id: company.id,
    registration_number: s(formData.get("registration_number")) ?? "—",
    vehicle_type: s(formData.get("vehicle_type")),
    brand: s(formData.get("brand")),
    model: s(formData.get("model")),
    service_date: s(formData.get("service_date")),
    status: s(formData.get("status")) ?? "actif",
    responsible_id: s(formData.get("responsible_id")),
    supervisor_id: s(formData.get("supervisor_id")),
  });
  revalidatePath("/dashboard/vehicles");
}

export async function createEmployee(formData: FormData) {
  const { company } = await requireContext();
  const supabase = await createClient();
  await supabase.from("employees").insert({
    company_id: company.id,
    first_name: s(formData.get("first_name")) ?? "—",
    last_name: s(formData.get("last_name")) ?? "—",
    job_title: s(formData.get("job_title")),
    email: s(formData.get("email")),
    phone: s(formData.get("phone")),
    status: s(formData.get("status")) ?? "actif",
    responsible_id: s(formData.get("responsible_id")),
    supervisor_id: s(formData.get("supervisor_id")),
  });
  revalidatePath("/dashboard/employees");
}

export async function createEquipment(formData: FormData) {
  const { company } = await requireContext();
  const supabase = await createClient();
  await supabase.from("equipments").insert({
    company_id: company.id,
    name: s(formData.get("name")) ?? "—",
    equipment_type: s(formData.get("equipment_type")),
    site: s(formData.get("site")),
    internal_reference: s(formData.get("internal_reference")),
    status: s(formData.get("status")) ?? "actif",
    responsible_id: s(formData.get("responsible_id")),
    supervisor_id: s(formData.get("supervisor_id")),
  });
  revalidatePath("/dashboard/equipments");
}

export async function createEpi(formData: FormData) {
  const { company } = await requireContext();
  const supabase = await createClient();
  await supabase.from("epi").insert({
    company_id: company.id,
    epi_type: s(formData.get("epi_type")) ?? "Autre",
    internal_reference: s(formData.get("internal_reference")),
    assigned_employee_id: s(formData.get("assigned_employee_id")),
    issue_date: s(formData.get("issue_date")),
    renewal_date: s(formData.get("renewal_date")),
    status: s(formData.get("status")) ?? "actif",
    responsible_id: s(formData.get("responsible_id")),
    supervisor_id: s(formData.get("supervisor_id")),
  });
  revalidatePath("/dashboard/epi");
  revalidatePath("/dashboard");
}

/** Crée l'enregistrement document après upload du fichier dans Storage (côté client). */
export async function createDocument(input: {
  title: string;
  document_type?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  expiration_date?: string | null;
  obligation_id?: string | null;
  vehicle_id?: string | null;
  employee_id?: string | null;
  equipment_id?: string | null;
  epi_id?: string | null;
}) {
  const { company, profile } = await requireContext();
  const supabase = await createClient();
  const status =
    input.expiration_date && new Date(input.expiration_date) < new Date() ? "EXPIRED" : "COMPLIANT";
  await supabase.from("documents").insert({
    company_id: company.id,
    title: input.title,
    document_type: input.document_type ?? null,
    file_path: input.file_path ?? null,
    file_url: input.file_url ?? null,
    expiration_date: input.expiration_date ?? null,
    status,
    obligation_id: input.obligation_id ?? null,
    vehicle_id: input.vehicle_id ?? null,
    employee_id: input.employee_id ?? null,
    equipment_id: input.equipment_id ?? null,
    epi_id: input.epi_id ?? null,
    uploaded_by: profile.id,
  });
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard");
}

export async function markNotification(id: string, isRead: boolean) {
  await requireContext();
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: isRead }).eq("id", id);
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead() {
  const { profile } = await requireContext();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .or(`user_id.eq.${profile.id},user_id.is.null`)
    .eq("is_read", false);
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

export async function loadDemoData() {
  await requireContext();
  const supabase = await createClient();
  const { data } = await supabase.rpc("load_demo_data");
  revalidatePath("/dashboard");
  return String(data ?? "");
}
