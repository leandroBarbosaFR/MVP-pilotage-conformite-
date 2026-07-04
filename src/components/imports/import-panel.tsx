"use client";

import { useMemo, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { runImport } from "@/lib/actions/imports";
import { Button } from "@/components/ui/button";
import { FileInput, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";

type ImportType = "vehicles" | "employees" | "equipments" | "obligations";

const TYPE_LABELS: Record<ImportType, string> = {
  vehicles: "Véhicules",
  employees: "Salariés",
  equipments: "Équipements",
  obligations: "Obligations",
};

interface TargetField {
  key: string;
  label: string;
  required?: boolean;
}

const TARGET_FIELDS: Record<ImportType, TargetField[]> = {
  vehicles: [
    { key: "registration_number", label: "Immatriculation", required: true },
    { key: "vehicle_type", label: "Type de véhicule" },
    { key: "brand", label: "Marque" },
    { key: "model", label: "Modèle" },
    { key: "service_date", label: "Date de mise en service" },
  ],
  employees: [
    { key: "first_name", label: "Prénom", required: true },
    { key: "last_name", label: "Nom", required: true },
    { key: "job_title", label: "Poste" },
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Téléphone" },
  ],
  equipments: [
    { key: "name", label: "Nom", required: true },
    { key: "equipment_type", label: "Type d'équipement" },
    { key: "site", label: "Site" },
    { key: "internal_reference", label: "Référence interne" },
  ],
  obligations: [
    { key: "title", label: "Titre", required: true },
    { key: "category", label: "Catégorie" },
    { key: "due_date", label: "Échéance" },
    { key: "priority", label: "Priorité" },
  ],
};

export function ImportPanel({ companyId }: { companyId: string }) {
  void companyId;
  const [importType, setImportType] = useState<ImportType>("vehicles");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ imported: number; failed: number; total: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const fields = TARGET_FIELDS[importType];

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setResult(null);
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
      if (aoa.length === 0) {
        setHeaders([]);
        setDataRows([]);
        return;
      }
      const head = (aoa[0] as unknown[]).map((c) => String(c ?? "").trim());
      const body = aoa.slice(1).map((r) => (r as unknown[]).map((c) => String(c ?? "").trim()));
      setHeaders(head);
      setDataRows(body);

      // Pré-remplit le mapping quand un en-tête correspond au libellé ou à la clé.
      const auto: Record<string, string> = {};
      for (const field of TARGET_FIELDS[importType]) {
        const match = head.find(
          (h) =>
            h.toLowerCase() === field.label.toLowerCase() ||
            h.toLowerCase() === field.key.toLowerCase()
        );
        if (match) auto[field.key] = match;
      }
      setMapping(auto);
    } catch {
      setError("Impossible de lire le fichier. Vérifiez le format (CSV, XLS, XLSX).");
    }
  }

  const preview = useMemo(() => dataRows.slice(0, 5), [dataRows]);

  function buildMappedRows(): Record<string, string | null>[] {
    const colIndex = (col: string) => headers.indexOf(col);
    return dataRows.map((row) => {
      const obj: Record<string, string | null> = {};
      for (const field of fields) {
        const col = mapping[field.key];
        if (!col) {
          obj[field.key] = null;
          continue;
        }
        const idx = colIndex(col);
        const value = idx >= 0 ? row[idx] : undefined;
        obj[field.key] = value && value !== "" ? value : null;
      }
      return obj;
    });
  }

  function handleImport() {
    setError(null);
    setResult(null);
    if (dataRows.length === 0) {
      setError("Aucune donnée à importer.");
      return;
    }
    const rows = buildMappedRows();
    start(async () => {
      try {
        const res = await runImport({ import_type: importType, rows, fileName });
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'import.");
      }
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Importer un fichier Excel / CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Étape 1 : type d'import */}
        <div className="max-w-xs">
          <Label>1. Type de données</Label>
          <Select
            value={importType}
            onChange={(e) => {
              setImportType(e.target.value as ImportType);
              setMapping({});
              setResult(null);
            }}
          >
            {(Object.keys(TYPE_LABELS) as ImportType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>

        {/* Étape 2 : fichier */}
        <div className="max-w-md">
          <Label>2. Fichier</Label>
          <FileInput accept=".csv,.xls,.xlsx" onChange={handleFile} />
        </div>

        {/* Étape 3 : aperçu + mapping */}
        {headers.length > 0 ? (
          <>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                3. Aperçu ({dataRows.length} ligne{dataRows.length > 1 ? "s" : ""})
              </p>
              <Table>
                <THead>
                  <TR>
                    {headers.map((h, i) => (
                      <TH key={i}>{h || `Colonne ${i + 1}`}</TH>
                    ))}
                  </TR>
                </THead>
                <tbody>
                  {preview.map((row, ri) => (
                    <TR key={ri}>
                      {headers.map((_, ci) => (
                        <TD key={ci}>{row[ci] ?? ""}</TD>
                      ))}
                    </TR>
                  ))}
                </tbody>
              </Table>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Correspondance des colonnes
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key}>
                    <Label>
                      {field.label}
                      {field.required ? " *" : ""}
                    </Label>
                    <Select
                      value={mapping[field.key] ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                      }
                    >
                      <option value="">— Ignorer —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={h}>
                          {h || `Colonne ${i + 1}`}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Étape 4 : import */}
            <div>
              <Button onClick={handleImport} disabled={pending}>
                {pending ? "Import en cours…" : "Importer"}
              </Button>
            </div>
          </>
        ) : null}

        {error ? <p className="text-sm text-status-danger">{error}</p> : null}
        {result ? (
          <p className="text-sm text-status-ok">
            Import terminé : {result.imported} importée(s), {result.failed} en échec sur{" "}
            {result.total} ligne(s).
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
