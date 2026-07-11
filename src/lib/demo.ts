// Mode démonstration : sert des données en mémoire et contourne l'auth Supabase.
// Activé via NEXT_PUBLIC_DEMO_MODE = "true" ou "1" (sans backend, pour tester/démontrer).
const demoFlag = ["1", "true", "yes", "on"].includes(
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "").trim().toLowerCase()
);

// Démo publique en production : activée explicitement via NEXT_PUBLIC_DEMO_ENABLED
// (pour présenter l'app à des clients sans leurs identifiants). Sûr : le mode démo
// bascule TOUTE la couche de données sur le mock en mémoire — un visiteur démo ne
// peut jamais atteindre la vraie base Supabase, même avec l'auth contournée.
const prodDemoEnabled = ["1", "true", "yes", "on"].includes(
  (process.env.NEXT_PUBLIC_DEMO_ENABLED ?? "").trim().toLowerCase()
);

// Le basculement démo/live est autorisé hors production, OU en production quand
// NEXT_PUBLIC_DEMO_ENABLED est activé. Sinon, la prod reste toujours en live.
export const DEMO_ALLOWED = process.env.NODE_ENV !== "production" || prodDemoEnabled;

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
