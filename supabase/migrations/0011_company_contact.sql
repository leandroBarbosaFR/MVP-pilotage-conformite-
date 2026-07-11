-- =====================================================================
-- Coordonnées de l'entreprise (Paramètres éditables). Additif.
-- =====================================================================

alter table public.companies add column if not exists address       text;
alter table public.companies add column if not exists city          text;
alter table public.companies add column if not exists country       text;
alter table public.companies add column if not exists contact_email text;
alter table public.companies add column if not exists contact_phone text;
