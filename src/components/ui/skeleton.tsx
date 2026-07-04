import { cn } from "@/lib/utils";

/** Bloc de chargement animé (sobre, sans dépendance). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden />;
}

/** Squelette de tableau (en-tête + n lignes) dans une carte arrondie. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-4 border-b border-border p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3", i === 0 ? "w-1/4" : "w-1/6")} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-border p-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-1/4" : "w-1/6")} />
          ))}
          <Skeleton className="ml-auto h-8 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
