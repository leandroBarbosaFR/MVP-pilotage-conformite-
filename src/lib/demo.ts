// Mode démonstration : sert des données en mémoire et contourne l'auth Supabase.
// Activé via NEXT_PUBLIC_DEMO_MODE = "true" ou "1" (sans backend, pour tester/démontrer).
const demoFlag = ["1", "true", "yes", "on"].includes(
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "").trim().toLowerCase()
);

// Le basculement démo/live est disponible PARTOUT (dev + production) pour pouvoir
// présenter une démo depuis l'UI sans configuration ni passage par Vercel. Sûr :
// le mode démo bascule TOUTE la couche de données sur le mock en mémoire — un
// visiteur démo ne peut jamais atteindre la vraie base Supabase, même avec l'auth
// contournée. Pour le désactiver : NEXT_PUBLIC_DEMO_ENABLED=0 (ou false/off).
const demoDisabled = ["0", "false", "no", "off"].includes(
  (process.env.NEXT_PUBLIC_DEMO_ENABLED ?? "").trim().toLowerCase()
);

export const DEMO_ALLOWED = !demoDisabled;

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
