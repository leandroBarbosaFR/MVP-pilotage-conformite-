import Link from "next/link";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { buttonVariants } from "@/components/ui/button";

/** Lien vers l'Assistant IA avec une action pré-remplie (bouton IA d'un module). */
export function AiActionLink({ action, label }: { action: string; label: string }) {
  return (
    <Link
      href={`/dashboard/assistant-ia?action=${action}`}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <SparkleIcon size={16} className="text-accent" />
      {label}
    </Link>
  );
}
