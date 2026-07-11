-- =====================================================================
-- Table des relances (historique). Trace chaque relance : qui, quel canal,
-- quel élément, statut, commentaire. Réutilisée par toute l'app (documents
-- manquants, prestataires, contrats, actions, contrôles, personnel…).
-- Prudent : IF NOT EXISTS. « tenant » = companies.
-- =====================================================================

create table if not exists public.reminders (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  module              text,
  related_entity_type text,
  related_entity_id   uuid,
  title               text not null,
  person_to_remind    text,
  person_id           uuid references public.profiles(id) on delete set null,
  email               text,
  channel             text not null default 'interne',   -- email / telephone / interne / autre
  status              text not null default 'ENVOYEE',    -- A_FAIRE / ENVOYEE / A_RELANCER / CLOTUREE
  reminded_at         timestamptz not null default now(),
  next_reminder_at    date,
  comment             text,
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
-- Champs d'adresse manquants côté prestataires (formulaire complet).
alter table public.providers add column if not exists postal_code text;
alter table public.providers add column if not exists address_complement text;

create index if not exists reminders_company_idx on public.reminders (company_id);
create index if not exists reminders_related_idx on public.reminders (related_entity_type, related_entity_id);
create index if not exists reminders_status_idx  on public.reminders (status);

create trigger set_updated_at_reminders before update on public.reminders
  for each row execute function public.set_updated_at();

alter table public.reminders enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'reminders' and policyname = 'reminders_select') then
    create policy reminders_select on public.reminders
      for select using (company_id = public.auth_company_id());
    create policy reminders_insert on public.reminders
      for insert with check (company_id = public.auth_company_id() and public.auth_can_write());
    create policy reminders_update on public.reminders
      for update using (company_id = public.auth_company_id() and public.auth_can_write());
    create policy reminders_delete on public.reminders
      for delete using (company_id = public.auth_company_id() and public.auth_is_admin());
  end if;
end $$;
