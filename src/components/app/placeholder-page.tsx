import type { Icon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  items,
}: {
  title: string;
  description: string;
  icon: Icon;
  items?: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon size={28} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Module en préparation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ce module sera disponible prochainement.
            </p>
          </div>
          {items && items.length > 0 ? (
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {items.map((it) => (
                <li
                  key={it}
                  className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {it}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
