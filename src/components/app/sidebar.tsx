"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  SquaresFourIcon as SquaresFour,
  UsersIcon as Users,
  HardHatIcon as HardHat,
  GearIcon as Gear,
  TruckIcon as Truck,
  ShieldCheckIcon as ShieldCheck,
  FileTextIcon as FileText,
  ListChecksIcon as ListChecks,
  BellIcon as Bell,
  UploadSimpleIcon as UploadSimple,
  ArchiveIcon as Archive,
  ChartBarIcon as ChartBar,
  GearSixIcon as GearSix,
  ListIcon,
  XIcon as X,
  SignOutIcon as SignOut,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { canAccessModule, type AppModule } from "@/lib/permissions";
import { USER_ROLE_LABELS } from "@/types/enums";
import type { UserRole } from "@/lib/types/database";

const NAV: { href: string; label: string; icon: typeof SquaresFour; module: AppModule }[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: SquaresFour, module: "dashboard" },
  { href: "/dashboard/employees", label: "Personnel", icon: Users, module: "personnel" },
  { href: "/dashboard/epi", label: "EPI", icon: HardHat, module: "epi" },
  { href: "/dashboard/equipments", label: "Machines et équipements", icon: Gear, module: "equipments" },
  { href: "/dashboard/vehicles", label: "Véhicules", icon: Truck, module: "vehicles" },
  { href: "/dashboard/obligations", label: "Contrôles réglementaires", icon: ShieldCheck, module: "controls" },
  { href: "/dashboard/documents", label: "Documents", icon: FileText, module: "documents" },
  { href: "/dashboard/actions", label: "Actions", icon: ListChecks, module: "actions" },
  { href: "/dashboard/notifications", label: "Alertes", icon: Bell, module: "alerts" },
  { href: "/dashboard/imports", label: "Imports", icon: UploadSimple, module: "imports" },
  { href: "/dashboard/archives", label: "Archives", icon: Archive, module: "archives" },
  { href: "/dashboard/rapports", label: "Rapports", icon: ChartBar, module: "reports" },
  { href: "/dashboard/settings", label: "Paramètres", icon: GearSix, module: "settings" },
];

export function Sidebar({
  fullName,
  role,
  signOut,
}: {
  fullName: string;
  role: UserRole;
  signOut: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const roleLabel = USER_ROLE_LABELS[role] ?? role;
  const nav = NAV.filter((item) => canAccessModule(role, item.module));

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Barre mobile */}
      <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-heading md:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={18} className="text-accent" />
          Conformité PME
        </span>
        <button aria-label="Menu" onClick={() => setOpen((v) => !v)} className="p-1">
          {open ? <X size={20} /> : <ListIcon size={20} />}
        </button>
      </div>

      <aside
        className={cn(
          "w-full shrink-0 bg-sidebar text-sidebar-foreground md:flex md:w-64 md:flex-col",
          open ? "flex flex-col" : "hidden"
        )}
      >
        {/* Logo */}
        <div className="hidden items-center gap-2 border-b border-sidebar-border px-5 py-5 md:flex">
          <ShieldCheck size={22} className="text-accent" aria-hidden />
          <span className="text-base font-semibold tracking-tight text-sidebar-heading">
            Conformité PME
          </span>
        </div>

        {/* Navigation */}
        <nav data-tour="nav" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-surface hover:text-sidebar-heading"
                )}
              >
                <Icon size={18} aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Utilisateur */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-surface text-xs font-semibold text-sidebar-heading">
              {initials || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-sidebar-heading">{fullName}</div>
              <div className="truncate text-xs text-sidebar-foreground">{roleLabel}</div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Déconnexion"
                className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-surface hover:text-sidebar-heading"
              >
                <SignOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
