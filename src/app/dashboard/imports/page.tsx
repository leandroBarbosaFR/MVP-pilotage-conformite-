import { requireContext } from "@/lib/queries/auth";
import { getImportHistory } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ImportPanel } from "@/components/imports/import-panel";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, ImportStatus } from "@/lib/types/database";

const IMPORT_STATUS: Record<ImportStatus, { status: ComplianceStatus; label: string }> = {
  traite: { status: "ok", label: "Traité" },
  echoue: { status: "danger", label: "Échoué" },
  en_attente: { status: "warn", label: "En attente" },
};

export default async function ImportsPage() {
  const { company } = await requireContext();
  const history = await getImportHistory(company.id);

  return (
    <div>
      <PageHeader
        title="Imports"
        description="Importez vos données en masse depuis un fichier Excel ou CSV."
      />

      <ImportPanel companyId={company.id} />

      <h2 className="mb-3 text-sm font-semibold text-foreground">Historique des imports</h2>
      <Table>
        <THead>
          <TR>
            <TH>Fichier</TH>
            <TH>Type</TH>
            <TH>Statut</TH>
            <TH>Lignes</TH>
            <TH>Échecs</TH>
            <TH>Date</TH>
          </TR>
        </THead>
        <tbody>
          {history.length === 0 ? (
            <EmptyRow colSpan={6} message="Aucun import." />
          ) : (
            history.map((imp) => {
              const s = IMPORT_STATUS[imp.status] ?? { status: "none" as const, label: imp.status };
              return (
                <TR key={imp.id}>
                  <TD className="font-medium">{imp.file_name}</TD>
                  <TD>{imp.import_type}</TD>
                  <TD>
                    <StatusBadge status={s.status} label={s.label} />
                  </TD>
                  <TD>
                    {imp.imported_rows}/{imp.total_rows}
                  </TD>
                  <TD>{imp.failed_rows}</TD>
                  <TD>{formatDate(imp.created_at)}</TD>
                </TR>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}
