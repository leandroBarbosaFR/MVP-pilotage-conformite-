import { ChartBarIcon as ChartBar } from "@phosphor-icons/react/dist/ssr";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function RapportsPage() {
  return (
    <PlaceholderPage
      title="Rapports"
      description="Générez et exportez des rapports de conformité pour vos audits et votre pilotage QHSE."
      icon={ChartBar}
      items={[
        "Rapport de conformité global",
        "Échéances à venir",
        "Actions en retard",
        "Documents expirés",
        "Export PDF / Excel",
      ]}
    />
  );
}
