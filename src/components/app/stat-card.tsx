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
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: Icon;
  tone?: Tone;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
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
    </div>
  );
}
