import { requireContext } from "@/lib/queries/auth";
import { Sidebar } from "@/components/app/sidebar";
import { signOut } from "@/lib/actions/auth";

const ROLE_LABELS: Record<string, string> = {
  ADMIN_COMPANY: "Administrateur",
  SUPERVISOR: "Superviseur",
  RESPONSIBLE: "Responsable",
  VIEWER: "Lecteur",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireContext();
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || "Utilisateur";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        fullName={fullName}
        role={ROLE_LABELS[profile.role] ?? profile.role}
        signOut={signOut}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
