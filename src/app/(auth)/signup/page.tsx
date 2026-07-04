import Link from "next/link";
import { ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <ShieldCheck size={24} className="text-accent" />
          <span className="text-lg font-semibold tracking-tight text-foreground">Conformité PME</span>
        </Link>

        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-foreground">Créer un compte</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Créez votre entreprise et commencez à centraliser vos obligations.
          </p>
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
