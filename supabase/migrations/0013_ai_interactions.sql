-- =====================================================================
-- Historique des interactions avec l'assistant IA. Minimal, par tenant.
-- Ne stocke pas de données médicales détaillées.
-- =====================================================================

create table if not exists public.ai_interactions (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  user_id             uuid references public.profiles(id) on delete set null,
  action_type         text,
  question            text,
  response            text,
  related_entity_type text,
  related_entity_id   uuid,
  created_at          timestamptz not null default now()
);
create index if not exists ai_interactions_company_idx on public.ai_interactions (company_id);

alter table public.ai_interactions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ai_interactions' and policyname = 'ai_interactions_select') then
    create policy ai_interactions_select on public.ai_interactions
      for select using (company_id = public.auth_company_id());
    create policy ai_interactions_insert on public.ai_interactions
      for insert with check (company_id = public.auth_company_id());
  end if;
end $$;
