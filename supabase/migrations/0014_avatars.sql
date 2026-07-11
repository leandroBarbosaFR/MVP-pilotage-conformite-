-- =====================================================================
-- Avatars : photo de profil pour les salariés et les utilisateurs. Additif.
-- L'URL pointe vers un fichier du bucket Storage (signée ou publique).
-- =====================================================================

alter table public.employees add column if not exists avatar_url text;
alter table public.profiles  add column if not exists avatar_url text;
