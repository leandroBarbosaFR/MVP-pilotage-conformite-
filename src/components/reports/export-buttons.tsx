"use client";

import * as XLSX from "xlsx";
import { FilePdfIcon, FileXlsIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export interface ReportData {
  summary: { label: string; value: string | number }[];
  priorities: { label: string; count: number; status: string }[];
  upcoming: { title: string; due: string }[];
  overdue: { title: string; due: string }[];
  expired: { title: string; expiration: string }[];
  incidents: { title: string; date: string; status: string }[];
}

export function ExportButtons({ data }: { data: ReportData }) {
  function exportExcel() {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data.summary.map((s) => ({ Indicateur: s.label, Valeur: s.value }))),
      "Synthèse"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Module", "À traiter", "Statut"], ...data.priorities.map((p) => [p.label, p.count, p.status])]),
      "Priorités par module"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Titre", "Échéance"], ...data.upcoming.map((o) => [o.title, o.due])]),
      "Échéances à venir"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Titre", "Échéance"], ...data.overdue.map((a) => [a.title, a.due])]),
      "Actions en retard"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Titre", "Expiration"], ...data.expired.map((d) => [d.title, d.expiration])]),
      "Documents expirés"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Titre", "Date", "Statut"], ...data.incidents.map((n) => [n.title, n.date, n.status])]),
      "Incidents non clôturés"
    );

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `rapport-conformite-${stamp}.xlsx`);
  }

  function exportPdf() {
    // Impression navigateur -> "Enregistrer au format PDF".
    window.print();
  }

  return (
    <div className="no-print flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportPdf}>
        <FilePdfIcon size={16} />
        Exporter PDF
      </Button>
      <Button variant="outline" size="sm" onClick={exportExcel}>
        <FileXlsIcon size={16} />
        Exporter Excel
      </Button>
    </div>
  );
}
