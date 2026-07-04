import Link from "next/link";
import {
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
  SquaresFourIcon,
  TruckIcon,
  UsersIcon,
  GearIcon,
  BellIcon,
  FileTextIcon,
  UploadSimpleIcon,
  ArchiveIcon,
  DeviceMobileIcon,
  ClockCounterClockwiseIcon,
  DownloadSimpleIcon,
  WarningIcon,
  HardHatIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/contact-form";

const FEATURES = [
  { label: "Tableau de bord global", desc: "Une vue unique de votre conformité en temps réel.", icon: SquaresFourIcon },
  { label: "Personnel & habilitations", desc: "Formations, visites médicales, autorisations de conduite.", icon: UsersIcon },
  { label: "EPI", desc: "Casques, harnais, détecteurs — suivi des renouvellements.", icon: HardHatIcon },
  { label: "Machines & équipements", desc: "Contrôles périodiques et historique par équipement.", icon: GearIcon },
  { label: "Véhicules", desc: "Contrôle technique, assurance, entretien, permis.", icon: TruckIcon },
  { label: "Alertes & notifications", desc: "Soyez prévenu avant chaque échéance critique.", icon: BellIcon },
  { label: "Documents & preuves", desc: "Rapports, certificats et attestations centralisés.", icon: FileTextIcon },
  { label: "Import Excel / CSV", desc: "Reprenez vos données existantes en quelques minutes.", icon: UploadSimpleIcon },
  { label: "Upload PDF & scan mobile", desc: "Ajoutez une preuve depuis le terrain, depuis un mobile.", icon: DeviceMobileIcon },
  { label: "Archivage", desc: "Rien n'est supprimé : tout reste consultable.", icon: ArchiveIcon },
  { label: "Historique & audit", desc: "Traçabilité complète des actions et modifications.", icon: ClockCounterClockwiseIcon },
  { label: "Export pour audit", desc: "Générez un rapport prêt pour la direction ou l'auditeur.", icon: DownloadSimpleIcon },
];

const TOOLS = ["Excel", "Dossiers partagés", "Logiciels RH", "Logiciels de flotte", "TMS", "GMAO", "Papier"];

const TRUST = [
  "Sans remplacer vos outils métier",
  "Mise en place en quelques jours",
  "Pensé pour les PME industrielles",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <ShieldCheckIcon size={22} weight="fill" className="text-accent" />
            Conformité PME
          </span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="#fonctionnement" className="hover:text-foreground">Fonctionnement</Link>
            <Link href="#fonctionnalites" className="hover:text-foreground">Fonctionnalités</Link>
            <Link href="#contact" className="hover:text-foreground">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">Connexion</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Créer un compte</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Pilotage de conformité — transport, logistique & industrie
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Toute votre conformité,{" "}
              <span className="text-accent">au même endroit</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Suivez vos obligations, échéances, documents et actions prioritaires en un coup
              d&apos;œil. Ne ratez plus jamais un contrôle technique, une habilitation ou une
              vérification réglementaire.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#contact">
                <Button size="lg" className="gap-2">
                  Demander un diagnostic gratuit
                  <ArrowRightIcon size={16} weight="bold" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">Créer un compte</Button>
              </Link>
            </div>
            <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckIcon size={16} weight="bold" className="text-status-ok" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Aperçu produit */}
          <DashboardPreview />
        </div>
      </section>

      {/* Compatibilité outils */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Compatible avec vos outils actuels
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {TOOLS.map((t) => (
              <span key={t} className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="border-b border-border bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Comment ça fonctionne</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Une couche de pilotage qui centralise l&apos;essentiel, sans remplacer vos logiciels métier.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { n: "01", t: "Centralisez", d: "Importez vos véhicules, salariés, équipements et documents depuis Excel ou manuellement." },
              { n: "02", t: "Suivez", d: "Chaque échéance devient une alerte. Les responsables et superviseurs sont notifiés." },
              { n: "03", t: "Prouvez", d: "Générez un rapport de conformité prêt pour un audit ou votre direction." },
            ].map((s) => (
              <div key={s.n} className="rounded-lg border border-border bg-surface p-6">
                <div className="text-sm font-semibold text-accent">{s.n}</div>
                <div className="mt-2 text-base font-semibold">{s.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Tout ce qu&apos;il faut pour rester conforme</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Des modules pensés pour les responsables QHSE, maintenance, parc et RH.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ label, desc, icon: Icon }) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
                  <Icon size={20} />
                </span>
                <div className="mt-4 text-sm font-semibold">{label}</div>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programme pilote */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center sm:p-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight">Rejoignez le programme pilote</h2>
              <p className="mt-3 text-sm text-primary-foreground/80">
                Nous recherchons des entreprises pilotes dans le transport, la logistique et
                l&apos;industrie pour co-construire une version adaptée aux réalités du terrain.
              </p>
            </div>
            <Link href="#contact" className="shrink-0">
              <Button variant="outline" size="lg" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                Devenir entreprise pilote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Demander un diagnostic</h2>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            Laissez-nous vos coordonnées, nous revenons vers vous rapidement.
          </p>
          <ContactForm />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <ShieldCheckIcon size={14} weight="fill" className="text-accent" />
            Conformité PME — pilotage de conformité pour PME industrielles, transport et logistique.
          </span>
          <span>© {new Date().getFullYear()} Conformité PME</span>
        </div>
      </footer>
    </div>
  );
}

/** Aperçu stylisé du tableau de bord (pur décor, non interactif). */
function DashboardPreview() {
  const R = 34;
  const C = 2 * Math.PI * R;
  const segs = [
    { color: "hsl(var(--status-ok))", frac: 0.72 },
    { color: "hsl(var(--status-warn))", frac: 0.2 },
    { color: "hsl(var(--status-danger))", frac: 0.08 },
  ];
  let cum = 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="text-sm font-semibold">Tableau de bord</div>
        <div className="text-xs text-muted-foreground">21 mai 2024</div>
      </div>

      {/* Stat tiles */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Conforme", v: "72 %", tone: "text-status-ok", bg: "bg-status-ok/10" },
          { l: "À surveiller", v: "5", tone: "text-status-warn", bg: "bg-status-warn/10" },
          { l: "Critique", v: "2", tone: "text-status-danger", bg: "bg-status-danger/10" },
        ].map((s) => (
          <div key={s.l} className={`rounded-md ${s.bg} p-2.5`}>
            <div className="text-[11px] text-muted-foreground">{s.l}</div>
            <div className={`text-lg font-semibold ${s.tone}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-3">
        {/* Alertes */}
        <div className="col-span-3 rounded-md border border-border p-3">
          <div className="text-xs font-medium text-muted-foreground">Alertes prioritaires</div>
          <ul className="mt-2 space-y-2">
            {[
              { t: "Habilitation électrique", tone: "text-status-danger", bg: "bg-status-danger/10" },
              { t: "Contrôle nacelle N°12", tone: "text-status-danger", bg: "bg-status-danger/10" },
              { t: "Contrôle extincteurs", tone: "text-status-warn", bg: "bg-status-warn/10" },
            ].map((a) => (
              <li key={a.t} className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded ${a.bg} ${a.tone}`}>
                  <WarningIcon size={13} />
                </span>
                <span className="truncate text-xs text-foreground">{a.t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Donut */}
        <div className="col-span-2 flex flex-col items-center justify-center rounded-md border border-border p-3">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
              {segs.map((seg, i) => {
                const dash = seg.frac * C;
                const el = (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={`${dash} ${C}`}
                    strokeDashoffset={-cum * C}
                  />
                );
                cum += seg.frac;
                return el;
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">72%</div>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Conformité</div>
        </div>
      </div>
    </div>
  );
}
