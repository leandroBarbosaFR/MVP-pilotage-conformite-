import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold">Page introuvable</h1>
      <p className="text-sm text-muted-foreground">
        La ressource demandée n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/dashboard">
        <Button>Retour au tableau de bord</Button>
      </Link>
    </div>
  );
}
