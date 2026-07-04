-- =====================================================================
-- Nouveaux modules métier : Sites et locaux, Prestataires, Contrats,
-- Audits/inspections, Non-conformités.
-- Prudent : IF NOT EXISTS, aucune donnée supprimée. « tenant » = companies.
-- Les *_type restent en TEXT (souplesse) ; seuls les statuts sont des enums.
-- =====================================================================

-- 1. Enums de statut (guardés)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'contract_status') then
    create type contract_status as enum ('ACTIVE','TO_RENEW','EXPIRED','TERMINATED','ARCHIVED');
  end if;
  if not exists (select 1 from pg_type where typname = 'audit_status') then
    create type audit_status as enum ('PLANNED','IN_PROGRESS','DONE','LATE','CANCELLED','ARCHIVED');
  end if;
  if not exists (select 1 from pg_type where typname = 'audit_result') then
    create type audit_result as enum ('COMPLIANT','MINOR_NC','MAJOR_NC','CRITICAL','TO_REVIEW');
  end if;
  if not exists (select 1 from pg_type where typname = 'nc_status') then
    create type nc_status as enum ('OPEN','IN_PROGRESS','RESOLVED','VERIFIED','CLOSED','ARCHIVED');
  end if;
end $$;

-- 2. Sites et locaux
create table if not exists public.sites (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  name          text not null,
  site_type     text,
  address       text,
  city          text,
  postal_code   text,
  country       text,
  surface_area  numeric,
  activity_type text,
  manager_id    uuid references public.profiles(id) on delete set null,
  supervisor_id uuid references public.profiles(id) on delete set null,
  status        text not null default 'actif',
  notes         text,
  is_archived   boolean not null default false,
  archived_at   timestamptz,
  archived_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists sites_company_idx on public.sites (company_id);

-- 3. Prestataires
create table if not exists public.providers (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  name          text not null,
  provider_type text,
  contact_name  text,
  email         text,
  phone         text,
  address       text,
  city          text,
  country       text,
  notes         text,
  is_active     boolean not null default true,
  is_archived   boolean not null default false,
  archived_at   timestamptz,
  archived_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists providers_company_idx on public.providers (company_id);

-- 4. Contrats
create table if not exists public.contracts (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  title               text not null,
  contract_type       text,
  provider_id         uuid references public.providers(id) on delete set null,
  site_id             uuid references public.sites(id) on delete set null,
  related_entity_type related_entity_type,
  related_entity_id   uuid,
  start_date          date,
  end_date            date,
  renewal_date        date,
  notice_period_days  integer,
  amount              numeric,
  currency            text default 'EUR',
  responsible_id      uuid references public.profiles(id) on delete set null,
  supervisor_id       uuid references public.profiles(id) on delete set null,
  status              contract_status not null default 'ACTIVE',
  document_id         uuid references public.documents(id) on delete set null,
  notes               text,
  is_archived         boolean not null default false,
  archived_at         timestamptz,
  archived_by         uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists contracts_company_idx on public.contracts (company_id);
create index if not exists contracts_renewal_idx on public.contracts (renewal_date);

-- 5. Audits et inspections
create table if not exists public.audits (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete cascade,
  title              text not null,
  audit_type         text,
  site_id            uuid references public.sites(id) on delete set null,
  auditor_name       text,
  provider_id        uuid references public.providers(id) on delete set null,
  planned_date       date,
  completed_date     date,
  status             audit_status not null default 'PLANNED',
  result             audit_result,
  score              numeric,
  responsible_id     uuid references public.profiles(id) on delete set null,
  supervisor_id      uuid references public.profiles(id) on delete set null,
  report_document_id uuid references public.documents(id) on delete set null,
  notes              text,
  is_archived        boolean not null default false,
  archived_at        timestamptz,
  archived_by        uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists audits_company_idx on public.audits (company_id);

-- 6. Non-conformités
create table if not exists public.non_conformities (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  title               text not null,
  description         text,
  severity            priority_level not null default 'MEDIUM',
  source_type         text,
  source_id           uuid,
  site_id             uuid references public.sites(id) on delete set null,
  related_entity_type related_entity_type,
  related_entity_id   uuid,
  detected_at         date,
  responsible_id      uuid references public.profiles(id) on delete set null,
  supervisor_id       uuid references public.profiles(id) on delete set null,
  status              nc_status not null default 'OPEN',
  corrective_action_id uuid references public.actions(id) on delete set null,
  document_id         uuid references public.documents(id) on delete set null,
  is_archived         boolean not null default false,
  archived_at         timestamptz,
  archived_by         uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists non_conformities_company_idx on public.non_conformities (company_id);

-- 7. updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['sites','providers','contracts','audits','non_conformities']
  loop
    if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_' || t) then
      execute format(
        'create trigger set_updated_at_%1$s before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
    end if;
  end loop;
end $$;

-- 8. RLS : mêmes règles que les autres tables métier
do $$
declare t text;
begin
  foreach t in array array['sites','providers','contracts','audits','non_conformities']
  loop
    execute format('alter table public.%1$s enable row level security;', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_select') then
      execute format($f$
        create policy %1$s_select on public.%1$s
          for select using (company_id = public.auth_company_id());
        create policy %1$s_insert on public.%1$s
          for insert with check (company_id = public.auth_company_id() and public.auth_can_write());
        create policy %1$s_update on public.%1$s
          for update using (company_id = public.auth_company_id() and public.auth_can_write());
        create policy %1$s_delete on public.%1$s
          for delete using (company_id = public.auth_company_id() and public.auth_is_admin());
      $f$, t);
    end if;
  end loop;
end $$;
