"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
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
  SidebarSimpleIcon as SidebarToggle,
  BuildingsIcon as Buildings,
  HandshakeIcon as Handshake,
  ScrollIcon as Scroll,
  ClipboardTextIcon as ClipboardText,
  WarningIcon as Warning,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { canAccessModule, type AppModule } from "@/lib/permissions";
import { USER_ROLE_LABELS } from "@/types/enums";
import type { UserRole } from "@/lib/types/database";

type NavItem = { href: string; label: string; icon: typeof SquaresFour; module: AppModule; section?: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: SquaresFour, module: "dashboard" },
  { href: "/dashboard/employees", label: "Personnel", icon: Users, module: "personnel" },
  { href: "/dashboard/epi", label: "EPI", icon: HardHat, module: "epi" },
  { href: "/dashboard/equipments", label: "Machines et équipements", icon: Gear, module: "equipments" },
  { href: "/dashboard/vehicles", label: "Véhicules", icon: Truck, module: "vehicles" },
  { href: "/dashboard/sites", label: "Sites et locaux", icon: Buildings, module: "sites" },
  { href: "/dashboard/obligations", label: "Contrôles réglementaires", icon: ShieldCheck, module: "controls" },
  // Nouvelle section : modules transverses (documents, suivi, administration)
  { href: "/dashboard/documents", label: "Documents", icon: FileText, module: "documents", section: "Suivi & administration" },
  { href: "/dashboard/actions", label: "Actions", icon: ListChecks, module: "actions" },
  { href: "/dashboard/non-conformities", label: "Non-conformités", icon: Warning, module: "non_conformities" },
  { href: "/dashboard/audits", label: "Audits et inspections", icon: ClipboardText, module: "audits" },
  { href: "/dashboard/contracts", label: "Contrats", icon: Scroll, module: "contracts" },
  { href: "/dashboard/providers", label: "Prestataires", icon: Handshake, module: "providers" },
  { href: "/dashboard/notifications", label: "Alertes", icon: Bell, module: "alerts" },
  { href: "/dashboard/imports", label: "Imports", icon: UploadSimple, module: "imports" },
  { href: "/dashboard/archives", label: "Archives", icon: Archive, module: "archives" },
  { href: "/dashboard/rapports", label: "Rapports", icon: ChartBar, module: "reports" },
  { href: "/dashboard/settings", label: "Paramètres", icon: GearSix, module: "settings" },
];

const COLLAPSE_KEY = "cpme_sidebar_collapsed";

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const roleLabel = USER_ROLE_LABELS[role] ?? role;
  const nav = NAV.filter((item) => canAccessModule(role, item.module));
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
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar/90 px-4 py-3 text-sidebar-heading backdrop-blur md:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={18} weight="fill" className="text-accent" />
          Conformité PME
        </span>
        <button aria-label="Menu" onClick={() => setOpen((v) => !v)} className="p-1">
          {open ? <X size={20} /> : <ListIcon size={20} />}
        </button>
      </div>

      <aside
        className={cn(
          "z-20 shrink-0 bg-sidebar text-sidebar-foreground",
          "md:sticky md:top-0 md:flex md:h-screen md:flex-col",
          "md:transition-[width] md:duration-300 md:ease-in-out motion-reduce:md:transition-none",
          collapsed ? "md:w-16" : "md:w-64",
          open ? "flex w-full flex-col" : "hidden"
        )}
      >
        {/* Logo + bouton réduire */}
        <div
          className={cn(
            "hidden shrink-0 items-center border-b border-sidebar-border px-3 py-4 md:flex",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed ? (
            <span className="flex items-center gap-2 px-2 text-base font-semibold tracking-tight text-sidebar-heading">
              <ShieldCheck size={22} weight="fill" className="text-accent" aria-hidden />
              Conformité PME
            </span>
          ) : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Déployer le menu" : "Réduire le menu"}
            title={collapsed ? "Déployer le menu" : "Réduire le menu"}
            className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-surface hover:text-sidebar-heading"
          >
            <SidebarToggle size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav data-tour="nav" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {nav.map(({ href, label, icon: Icon, section }) => {
            const active = isActive(href);
            return (
              <Fragment key={href}>
                {section ? (
                  collapsed ? (
                    <div className="mx-3 my-2 border-t border-sidebar-border/70" aria-hidden />
                  ) : (
                    <div className="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                      {section}
                    </div>
                  )
                ) : null}
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "group relative flex items-center rounded-md py-2 text-sm transition-colors",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                    active
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-surface hover:text-sidebar-heading"
                  )}
                >
                  <Icon size={18} aria-hidden />
                  {!collapsed ? <span className="truncate">{label}</span> : null}
                  {collapsed ? (
                    <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border border-sidebar-border bg-sidebar-surface px-2 py-1 text-xs text-sidebar-heading group-hover:block">
                      {label}
                    </span>
                  ) : null}
                </Link>
              </Fragment>
            );
          })}
        </nav>

        {/* Utilisateur — reste en bas, flouté au scroll */}
        <div className="sticky bottom-0 border-t border-sidebar-border bg-sidebar/80 p-3 backdrop-blur">
          <div className={cn("flex items-center gap-3 rounded-md px-2 py-2", collapsed && "justify-center px-0")}>
            <span
              title={collapsed ? `${fullName} — ${roleLabel}` : undefined}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-surface text-xs font-semibold text-sidebar-heading"
            >
              {initials || "?"}
            </span>
            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-sidebar-heading">{fullName}</div>
                  <div className="truncate text-xs text-sidebar-foreground">{roleLabel}</div>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    aria-label="Déconnexion"
                    title="Déconnexion"
                    className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-surface hover:text-sidebar-heading"
                  >
                    <SignOut size={16} />
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
