// Mode démonstration : sert des données en mémoire et contourne l'auth Supabase.
// Activé via NEXT_PUBLIC_DEMO_MODE = "true" ou "1" (sans backend, pour tester/démontrer).
const demoFlag = ["1", "true", "yes", "on"].includes(
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "").trim().toLowerCase()
);

// Garde-fou : le mode démo n'est AUTORISÉ qu'en dehors de la production
// (build/run avec NODE_ENV=production, ce qui inclut Vercel). La prod utilise
// donc toujours la vraie base Supabase, quels que soient le flag ou le cookie.
export const DEMO_ALLOWED = process.env.NODE_ENV !== "production";

// Cookie qui permet de basculer démo/live à chaud (bouton du tableau de bord).
export const DEMO_COOKIE = "demo_mode";

/**
 * Décide du mode démo à l'exécution : le cookie (défini par le bouton) prime,
 * sinon on retombe sur le flag d'environnement. Toujours `false` en production.
 */
export function resolveDemoMode(cookieValue: string | null | undefined): boolean {
  if (!DEMO_ALLOWED) return false;
  if (cookieValue === "1") return true;
  if (cookieValue === "0") return false;
  return demoFlag;
}

// Valeur par défaut (sans cookie), pour les usages statiques.
export const DEMO_MODE = DEMO_ALLOWED && demoFlag;

export const DEMO_USER_ID = "demo-user-0000";
export const DEMO_COMPANY_ID = "demo-company-0000";
