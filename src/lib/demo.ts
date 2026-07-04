// Mode démonstration : sert des données en mémoire et contourne l'auth Supabase.
// Activé via NEXT_PUBLIC_DEMO_MODE = "true" ou "1" (sans backend, pour tester/démontrer).
export const DEMO_MODE = ["1", "true", "yes", "on"].includes(
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "").trim().toLowerCase()
);

export const DEMO_USER_ID = "demo-user-0000";
export const DEMO_COMPANY_ID = "demo-company-0000";
