import { requireContext } from "@/lib/queries/auth";
import { Sidebar } from "@/components/app/sidebar";
import { DashboardTour } from "@/components/app/dashboard-tour";
import { signOut } from "@/lib/actions/auth";
import { DEMO_MODE } from "@/lib/demo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireContext();
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || "Utilisateur";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar fullName={fullName} role={profile.role} signOut={signOut} />
      <div className="flex min-w-0 flex-1 flex-col">
        {DEMO_MODE ? (
          <div className="border-b border-status-warn/40 bg-status-warn/10 px-4 py-1.5 text-center text-xs font-medium text-status-warn">
            Mode démonstration — données fictives, aucune connexion à la base
          </div>
        ) : null}
        <main data-tour="page" className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <DashboardTour />
    </div>
  );
}
