import Link from "next/link";

export function Pagination({
  basePath,
  page,
  count,
  pageSize,
  params = {},
}: {
  basePath: string;
  page: number;
  count: number;
  pageSize: number;
  params?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  const build = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} / {totalPages} — {count} éléments
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={build(page - 1)} className="border border-border px-3 py-1 hover:bg-muted">
            Précédent
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={build(page + 1)} className="border border-border px-3 py-1 hover:bg-muted">
            Suivant
          </Link>
        ) : null}
      </div>
    </div>
  );
}
