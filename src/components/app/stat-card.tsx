import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";

type Tone = ComplianceStatus | "neutral";

const VALUE_COLOR: Record<Tone, string> = {
  ok: "text-status-ok",
  warn: "text-status-warn",
  danger: "text-status-danger",
  none: "text-foreground",
  neutral: "text-foreground",
};

const ICON_BG: Record<Tone, string> = {
  ok: "bg-status-ok/10 text-status-ok",
  warn: "bg-status-warn/10 text-status-warn",
  danger: "bg-status-danger/10 text-status-danger",
  none: "bg-muted text-muted-foreground",
  neutral: "bg-muted text-muted-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: Icon;
  tone?: Tone;
  /** Rend la carte cliquable vers la page/section correspondante. */
  href?: string;
}) {
  const content = (
    <>
      {Icon ? (
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", ICON_BG[tone])}>
          <Icon size={20} aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={cn("mt-0.5 text-2xl font-semibold tabular-nums", VALUE_COLOR[tone])}>{value}</div>
        {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
    </>
  );

  const base = "flex items-start gap-3 rounded-lg border border-border bg-surface p-4";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={base}>{content}</div>;
}
