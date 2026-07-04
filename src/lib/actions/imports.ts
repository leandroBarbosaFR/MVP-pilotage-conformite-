"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/queries/auth";

type ImportType = "vehicles" | "employees" | "equipments" | "obligations";

const ALLOWED: ImportType[] = ["vehicles", "employees", "equipments", "obligations"];

/** Champs obligatoires par type — une ligne sans ces champs est comptée en échec. */
const REQUIRED: Record<ImportType, string[]> = {
  vehicles: ["registration_number"],
  employees: ["first_name", "last_name"],
  equipments: ["name"],
  obligations: ["title"],
};

const TABLE: Record<ImportType, string> = {
  vehicles: "vehicles",
  employees: "employees",
  equipments: "equipments",
  obligations: "obligations",
};

function val(row: Record<string, string | null>, key: string): string | null {
  const v = row[key];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function buildRecord(
  type: ImportType,
  row: Record<string, string | null>,
  companyId: string
): Record<string, unknown> | null {
  const missing = REQUIRED[type].some((f) => !val(row, f));
  if (missing) return null;

  switch (type) {
    case "vehicles":
      return {
        company_id: companyId,
        registration_number: val(row, "registration_number"),
        vehicle_type: val(row, "vehicle_type"),
        brand: val(row, "brand"),
        model: val(row, "model"),
        service_date: val(row, "service_date"),
      };
    case "employees":
      return {
        company_id: companyId,
        first_name: val(row, "first_name"),
        last_name: val(row, "last_name"),
        job_title: val(row, "job_title"),
        email: val(row, "email"),
        phone: val(row, "phone"),
      };
    case "equipments":
      return {
        company_id: companyId,
        name: val(row, "name"),
        equipment_type: val(row, "equipment_type"),
        site: val(row, "site"),
        internal_reference: val(row, "internal_reference"),
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

  const total = rows.length;
  let imported = 0;
  let failed = 0;

  const records: Record<string, unknown>[] = [];
  for (const row of rows) {
    const record = buildRecord(type, row, company.id);
    if (!record) {
      failed += 1;
      continue;
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

  return { imported, failed, total };
}
