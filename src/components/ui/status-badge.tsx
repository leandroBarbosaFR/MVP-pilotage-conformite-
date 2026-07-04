import { cn } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";
import { STATUS_LABELS } from "@/lib/status";

const STYLES: Record<ComplianceStatus, string> = {
  ok: "border-status-ok text-status-ok",
  warn: "border-status-warn text-status-warn",
  danger: "border-status-danger text-status-danger",
  none: "border-status-none text-status-none",
};

const DOT: Record<ComplianceStatus, string> = {
  ok: "bg-status-ok",
  warn: "bg-status-warn",
  danger: "bg-status-danger",
  none: "bg-status-none",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: ComplianceStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border bg-background px-2 py-0.5 text-xs font-medium",
        STYLES[status],
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", DOT[status])} aria-hidden />
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
