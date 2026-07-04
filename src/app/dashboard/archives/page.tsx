import { ArchiveIcon as Archive } from "@phosphor-icons/react/dist/ssr";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function ArchivesPage() {
  return (
    <PlaceholderPage
      title="Archives"
      description="Consultez les éléments archivés (personnel, EPI, machines, véhicules, contrôles, documents, actions) sans les supprimer."
      icon={Archive}
      items={[
        "Personnel",
        "EPI",
        "Machines",
        "Véhicules",
        "Contrôles",
        "Documents",
        "Actions",
      ]}
    />
  );
}
