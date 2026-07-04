import Link from "next/link";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "right";
};

export type CardField = { label: string; value: React.ReactNode };

export type CardConfig = {
  title: React.ReactNode;
  badge?: React.ReactNode;
  fields?: CardField[];
};

/**
 * Liste responsive : tableau sur desktop (md+), cartes compactes sur mobile.
 * `href` ajoute une icône « œil » vers le détail ; `actions` reçoit les
 * boutons (archiver, ouvrir…) affichés en fin de ligne / pied de carte.
 */
export function ListView<T>({
  rows,
  getKey,
  columns,
  card,
  empty,
  href,
  actions,
}: {
  rows: T[];
  getKey: (row: T) => string;
  columns: Column<T>[];
  card: (row: T) => CardConfig;
  empty: string;
  href?: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
}) {
  const hasActionsCol = Boolean(href || actions);
  const colSpan = columns.length + (hasActionsCol ? 1 : 0);

  const eye = (row: T, extra?: string) =>
    href ? (
      <Link
        href={href(row)}
        aria-label="Voir le détail"
        title="Voir le détail"
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          extra
        )}
      >
        <EyeIcon size={16} />
      </Link>
    ) : null;

  return (
    <>
      {/* Desktop : tableau */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <TR>
              {columns.map((c, i) => (
                <TH key={i} className={c.align === "right" ? "text-right" : undefined}>{c.header}</TH>
              ))}
              {hasActionsCol ? <TH className="text-right">Actions</TH> : null}
            </TR>
          </THead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={colSpan} message={empty} />
            ) : (
              rows.map((row) => (
                <TR key={getKey(row)}>
                  {columns.map((c, i) => (
                    <TD key={i} className={c.align === "right" ? "text-right" : undefined}>{c.cell(row)}</TD>
                  ))}
                  {hasActionsCol ? (
                    <TD>
                      <div className="flex items-center justify-end gap-2">
                        {eye(row)}
                        {actions?.(row)}
                      </div>
                    </TD>
                  ) : null}
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Mobile : cartes */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-muted-foreground">
            {empty}
          </div>
        ) : (
          rows.map((row) => {
            const c = card(row);
            return (
              <div key={getKey(row)} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-sm font-medium text-foreground">
                    {href ? (
                      <Link href={href(row)} className="hover:underline">{c.title}</Link>
                    ) : (
                      c.title
                    )}
                  </div>
                  {eye(row)}
                </div>
                {c.badge ? <div className="mt-2">{c.badge}</div> : null}
                {c.fields && c.fields.length > 0 ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                    {c.fields.map((f, i) => (
                      <div key={i} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{f.label}</dt>
                        <dd className="truncate text-sm text-foreground">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {actions ? (
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                    {actions(row)}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
