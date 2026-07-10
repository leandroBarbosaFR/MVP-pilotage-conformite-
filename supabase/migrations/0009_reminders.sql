-- =====================================================================
-- Suivi des relances. Prudent : add column if not exists, additif.
-- La relance elle-même réutilise le module Actions (catégorie « Relance ») :
-- pas de table doublon. On horodate seulement les relances côté prestataire.
-- =====================================================================

alter table public.providers add column if not exists last_reminded_at timestamptz;
alter table public.providers add column if not exists reminder_count integer not null default 0;
