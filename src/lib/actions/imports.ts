"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/queries/auth";

type ImportType =
  | "vehicles"
  | "employees"
  | "equipments"
  | "obligations"
  | "sites"
  | "providers"
  | "contracts"
  | "actions"
  | "certifications";

const ALLOWED: ImportType[] = [
  "vehicles", "employees", "equipments", "obligations",
  "sites", "providers", "contracts", "actions", "certifications",
];

/** Champs obligatoires par type — une ligne sans ces champs est comptée en échec. */
const REQUIRED: Record<ImportType, string[]> = {
  vehicles: ["registration_number"],
  employees: ["first_name", "last_name"],
  equipments: ["name"],
  obligations: ["title"],
  sites: ["name"],
  providers: ["name"],
  contracts: ["title"],
  actions: ["title"],
  certifications: ["title"],
};

const TABLE: Record<ImportType, string> = {
  vehicles: "vehicles",
  employees: "employees",
  equipments: "equipments",
  obligations: "obligations",
  sites: "sites",
  providers: "providers",
  contracts: "contracts",
  actions: "actions",
  certifications: "employee_certifications",
};

/** Colonne servant d'identifiant pour éviter les doublons (comparaison insensible à la casse). */
const DEDUP_KEY: Partial<Record<ImportType, string>> = {
  vehicles: "registration_number",
  employees: "email",
  equipments: "internal_reference",
  sites: "name",
  providers: "name",
  contracts: "title",
};

interface BuildContext {
  companyId: string;
  empByEmail: Map<string, string>;
  empByName: Map<string, string>;
}

function val(row: Record<string, string | null>, key: string): string | null {
  const v = row[key];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function certStatus(expiry: string | null): string {
  if (!expiry) return "COMPLIANT";
  const days = Math.round((new Date(expiry).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(days)) return "COMPLIANT";
  if (days < 0) return "EXPIRED";
  if (days <= 30) return "EXPIRING_SOON";
  return "COMPLIANT";
}

function buildRecord(
  type: ImportType,
  row: Record<string, string | null>,
  ctx: BuildContext
): Record<string, unknown> | null {
  const missing = REQUIRED[type].some((f) => !val(row, f));
  if (missing) return null;
  const companyId = ctx.companyId;

  switch (type) {
    case "vehicles":
      return {
        company_id: companyId,
        registration_number: val(row, "registration_number"),
        vehicle_type: val(row, "vehicle_type"),
        brand: val(row, "brand"),
        model: val(row, "model"),
        service_date: val(row, "service_date"),
        insurance_expiry: val(row, "insurance_expiry"),
        technical_inspection_expiry: val(row, "technical_inspection_expiry"),
      };
    case "employees":
      return {
        company_id: companyId,
        first_name: val(row, "first_name"),
        last_name: val(row, "last_name"),
        job_title: val(row, "job_title"),
        job_family: val(row, "job_family"),
        contract_type: val(row, "contract_type"),
        email: val(row, "email"),
        phone: val(row, "phone"),
      };
    case "equipments":
      return {
        company_id: companyId,
        name: val(row, "name"),
        equipment_type: val(row, "equipment_type"),
        category: val(row, "category"),
        site: val(row, "site"),
        internal_reference: val(row, "internal_reference"),
        next_check_date: val(row, "next_check_date"),
      };
    case "obligations":
      return {
        company_id: companyId,
        title: val(row, "title"),
        category: val(row, "category") ?? "autre",
        due_date: val(row, "due_date"),
        priority: val(row, "priority") ?? "MEDIUM",
        status: "COMPLIANT",
      };
    case "sites":
      return {
        company_id: companyId,
        name: val(row, "name"),
        site_type: val(row, "site_type"),
        address: val(row, "address"),
        city: val(row, "city"),
        postal_code: val(row, "postal_code"),
        country: val(row, "country") ?? "France",
        activity_type: val(row, "activity_type"),
        status: "actif",
      };
    case "providers":
      return {
        company_id: companyId,
        name: val(row, "name"),
        provider_type: val(row, "provider_type"),
        contact_name: val(row, "contact_name"),
        email: val(row, "email"),
        phone: val(row, "phone"),
        city: val(row, "city"),
        insurance_expiry: val(row, "insurance_expiry"),
      };
    case "contracts":
      return {
        company_id: companyId,
        title: val(row, "title"),
        contract_type: val(row, "contract_type"),
        start_date: val(row, "start_date"),
        end_date: val(row, "end_date"),
        renewal_date: val(row, "renewal_date"),
        status: "ACTIVE",
      };
    case "actions":
      return {
        company_id: companyId,
        title: val(row, "title"),
        description: val(row, "description"),
        due_date: val(row, "due_date"),
        priority: val(row, "priority") ?? "MEDIUM",
        status: "TODO",
      };
    case "certifications": {
      // Rattachement au salarié via e-mail ou nom complet.
      const email = val(row, "employee_email");
      const name = val(row, "employee_name");
      const employeeId =
        (email ? ctx.empByEmail.get(email.toLowerCase()) : undefined) ??
        (name ? ctx.empByName.get(name.toLowerCase()) : undefined);
      if (!employeeId) return null; // salarié introuvable -> échec
      const expiry = val(row, "expiry_date");
      return {
        company_id: companyId,
        employee_id: employeeId,
        type: val(row, "type") ?? "OTHER",
        category: val(row, "category"),
        title: val(row, "title"),
        obtained_date: val(row, "obtained_date"),
        expiry_date: expiry,
        status: certStatus(expiry),
        priority: "MEDIUM",
      };
    }
  }
}

export async function runImport({
  import_type,
  rows,
  fileName,
}: {
  import_type: string;
  rows: Record<string, string | null>[];
  fileName?: string;
}) {
  if (!ALLOWED.includes(import_type as ImportType)) {
    throw new Error("Type d'import non autorisé");
  }
  const type = import_type as ImportType;
  const { company, profile } = await requireContext();
  const supabase = await createClient();

  // Contexte : lookup salariés (pour certifications)
  const empByEmail = new Map<string, string>();
  const empByName = new Map<string, string>();
  if (type === "certifications") {
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email")
      .eq("company_id", company.id);
    for (const e of data ?? []) {
      if (e.email) empByEmail.set(String(e.email).toLowerCase(), e.id as string);
      const name = [e.first_name, e.last_name].filter(Boolean).join(" ").toLowerCase();
      if (name) empByName.set(name, e.id as string);
    }
  }
  const ctx: BuildContext = { companyId: company.id, empByEmail, empByName };

  // Identifiants déjà présents (anti-doublon)
  const dedupCol = DEDUP_KEY[type];
  const existingKeys = new Set<string>();
  if (dedupCol) {
    const { data } = await supabase.from(TABLE[type]).select(dedupCol).eq("company_id", company.id);
    for (const r of ((data ?? []) as unknown as Record<string, unknown>[])) {
      const v = r[dedupCol];
      if (v != null) existingKeys.add(String(v).toLowerCase());
    }
  }

  const total = rows.length;
  let imported = 0;
  let failed = 0;
  let skipped = 0;

  const records: Record<string, unknown>[] = [];
  for (const row of rows) {
    const record = buildRecord(type, row, ctx);
    if (!record) {
      failed += 1;
      continue;
    }
    if (dedupCol) {
      const key = record[dedupCol];
      if (key != null) {
        const norm = String(key).toLowerCase();
        if (existingKeys.has(norm)) {
          skipped += 1;
          continue;
        }
        existingKeys.add(norm); // évite aussi les doublons au sein du même fichier
      }
    }
    records.push(record);
  }

  if (records.length > 0) {
    const { error } = await supabase.from(TABLE[type]).insert(records);
    if (error) {
      // Bascule en insertion ligne par ligne pour compter précisément les échecs.
      for (const record of records) {
        const { error: rowError } = await supabase.from(TABLE[type]).insert(record);
        if (rowError) failed += 1;
        else imported += 1;
      }
    } else {
      imported += records.length;
    }
  }

  const status: "traite" | "echoue" = failed > 0 && imported === 0 ? "echoue" : "traite";

  await supabase.from("imports").insert({
    company_id: company.id,
    file_name: fileName ?? "import",
    import_type: type,
    status,
    total_rows: total,
    imported_rows: imported,
    failed_rows: failed,
    uploaded_by: profile.id,
  });

  revalidatePath("/dashboard/imports");
  revalidatePath("/dashboard");

  return { imported, failed, skipped, total };
}
