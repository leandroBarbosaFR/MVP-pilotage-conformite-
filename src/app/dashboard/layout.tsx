import { requireContext } from "@/lib/queries/auth";
import { Sidebar } from "@/components/app/sidebar";
import { DashboardTour } from "@/components/app/dashboard-tour";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import { signOut } from "@/lib/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireContext();
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || "Utilisateur";

  return (
    <ToastProvider>
      <ConfirmProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar fullName={fullName} role={profile.role} signOut={signOut} avatarUrl={profile.avatar_url} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main data-tour="page" className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
        <DashboardTour />
      </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
