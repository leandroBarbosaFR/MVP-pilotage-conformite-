-- =====================================================================
-- Actions : source + preuve attendue.  Non-conformités : échéance de correction.
-- (related_entity_type / related_entity_id existent déjà sur les deux tables.)
-- Prudent : colonnes nullable, IF NOT EXISTS.
-- =====================================================================
alter table public.actions add column if not exists source text;
alter table public.actions add column if not exists expected_proof text;
alter table public.non_conformities add column if not exists due_date date;
