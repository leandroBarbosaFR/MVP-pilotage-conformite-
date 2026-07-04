import Link from "next/link";
import { ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; confirm?: string }>;
}) {
  const { redirect, confirm } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <ShieldCheck size={24} className="text-accent" />
          <span className="text-lg font-semibold tracking-tight text-foreground">Conformity</span>
        </Link>

        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">Connexion</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Accédez à votre espace de pilotage de conformité.
          </p>
          {confirm ? (
            <div className="mb-4 rounded-md border border-status-warn bg-status-warn/10 px-3 py-2 text-sm text-status-warn">
              Vérifiez votre email pour confirmer votre compte, puis connectez-vous.
            </div>
          ) : null}
          <LoginForm redirectTo={redirect ?? "/dashboard"} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
