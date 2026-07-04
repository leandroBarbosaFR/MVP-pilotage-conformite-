-- =====================================================================
-- Obligations : document attendu + preuve attendue (métadonnées de contrôle).
-- Prudent : colonnes nullable, IF NOT EXISTS.
-- =====================================================================
alter table public.obligations add column if not exists expected_document text;
alter table public.obligations add column if not exists expected_proof text;
