-- =====================================================================
-- Pilotage Conformité — Schéma initial
-- PostgreSQL / Supabase : tables, enums, RLS, triggers, storage, RPC
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role as enum ('ADMIN_COMPANY', 'SUPERVISOR', 'RESPONSIBLE', 'VIEWER');

create type obligation_category as enum
  ('vehicule', 'conducteur', 'equipement', 'site', 'document', 'audit', 'formation', 'autre');

create type obligation_frequency as enum
  ('unique', 'mensuelle', 'trimestrielle', 'semestrielle', 'annuelle', 'personnalisee');

create type priority_level as enum ('faible', 'moyen', 'critique');

create type obligation_status as enum ('a_jour', 'bientot_expire', 'expire', 'archive');

create type action_status as enum ('a_faire', 'en_cours', 'termine', 'en_retard', 'archive');

create type import_status as enum ('en_attente', 'traite', 'echoue');

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table public.companies (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  sector         text,
  employee_count text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  first_name  text,
  last_name   text,
  email       text,
  role        user_role not null default 'ADMIN_COMPANY',
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.profiles (company_id);

create table public.vehicles (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  registration_number text not null,
  vehicle_type        text,
  brand               text,
  model               text,
  service_date        date,
  status              text not null default 'actif',
  responsible_id      uuid references public.profiles(id) on delete set null,
  supervisor_id       uuid references public.profiles(id) on delete set null,
  is_archived         boolean not null default false,
  archived_at         timestamptz,
  archived_by         uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on public.vehicles (company_id);

create table public.employees (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  first_name     text not null,
  last_name      text not null,
  job_title      text,
  email          text,
  phone          text,
  status         text not null default 'actif',
  responsible_id uuid references public.profiles(id) on delete set null,
  supervisor_id  uuid references public.profiles(id) on delete set null,
  is_archived    boolean not null default false,
  archived_at    timestamptz,
  archived_by    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.employees (company_id);

create table public.equipments (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete cascade,
  name               text not null,
  equipment_type     text,
  site               text,
  internal_reference text,
  status             text not null default 'actif',
  responsible_id     uuid references public.profiles(id) on delete set null,
  supervisor_id      uuid references public.profiles(id) on delete set null,
  is_archived        boolean not null default false,
  archived_at        timestamptz,
  archived_by        uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on public.equipments (company_id);

create table public.obligations (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  title               text not null,
  category            obligation_category not null default 'autre',
  description         text,
  due_date            date,
  frequency           obligation_frequency not null default 'unique',
  priority            priority_level not null default 'moyen',
  status              obligation_status not null default 'a_jour',
  responsible_id      uuid references public.profiles(id) on delete set null,
  supervisor_id       uuid references public.profiles(id) on delete set null,
  linked_vehicle_id   uuid references public.vehicles(id) on delete set null,
  linked_employee_id  uuid references public.employees(id) on delete set null,
  linked_equipment_id uuid references public.equipments(id) on delete set null,
  comments            text,
  is_archived         boolean not null default false,
  archived_at         timestamptz,
  archived_by         uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on public.obligations (company_id);
create index on public.obligations (due_date);

create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  title           text not null,
  document_type   text,
  file_url        text,
  file_path       text,
  expiration_date date,
  status          text not null default 'a_jour',
  obligation_id   uuid references public.obligations(id) on delete set null,
  vehicle_id      uuid references public.vehicles(id) on delete set null,
  employee_id     uuid references public.employees(id) on delete set null,
  equipment_id    uuid references public.equipments(id) on delete set null,
  uploaded_by     uuid references public.profiles(id) on delete set null,
  is_archived     boolean not null default false,
  archived_at     timestamptz,
  archived_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.documents (company_id);
create index on public.documents (obligation_id);

create table public.actions (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  title          text not null,
  description    text,
  status         action_status not null default 'a_faire',
  priority       priority_level not null default 'moyen',
  due_date       date,
  responsible_id uuid references public.profiles(id) on delete set null,
  supervisor_id  uuid references public.profiles(id) on delete set null,
  obligation_id  uuid references public.obligations(id) on delete set null,
  comment        text,
  is_archived    boolean not null default false,
  archived_at    timestamptz,
  archived_by    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.actions (company_id);
create index on public.actions (due_date);

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  title         text not null,
  message       text,
  type          text,
  obligation_id uuid references public.obligations(id) on delete set null,
  action_id     uuid references public.actions(id) on delete set null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index on public.notifications (user_id);
create index on public.notifications (company_id);

create table public.imports (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  file_name     text not null,
  file_url      text,
  import_type   text not null,
  status        import_status not null default 'en_attente',
  total_rows    integer not null default 0,
  imported_rows integer not null default 0,
  failed_rows   integer not null default 0,
  error_log     jsonb,
  uploaded_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index on public.imports (company_id);

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references public.companies(id) on delete cascade,
  user_id     uuid,
  action_type text not null,          -- INSERT / UPDATE / DELETE
  entity_type text not null,
  entity_id   uuid,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz not null default now()
);
create index on public.audit_logs (company_id);
create index on public.audit_logs (entity_type, entity_id);

-- Prospects du programme pilote (formulaire landing page, table publique)
create table public.pilot_leads (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  company        text,
  sector         text,
  employee_count text,
  message        text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Company de l'utilisateur courant (SECURITY DEFINER : évite la récursion RLS)
create or replace function public.auth_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid() limit 1;
$$;

-- L'utilisateur peut-il écrire (tout sauf VIEWER) ?
create or replace function public.auth_can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() <> 'VIEWER', false);
$$;

-- Création automatique de la company + profil admin à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_company_id uuid;
begin
  insert into public.companies (name, sector, employee_count)
  values (
    coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), 'Mon entreprise'),
    new.raw_user_meta_data->>'sector',
    new.raw_user_meta_data->>'employee_count'
  )
  returning id into new_company_id;

  insert into public.profiles (user_id, company_id, first_name, last_name, email, role)
  values (
    new.id,
    new_company_id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    'ADMIN_COMPANY'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Journalisation d'audit générique
create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_company uuid;
  v_profile uuid;
begin
  v_company := coalesce(new.company_id, old.company_id);
  select id into v_profile from public.profiles where user_id = auth.uid() limit 1;

  insert into public.audit_logs (company_id, user_id, action_type, entity_type, entity_id, old_value, new_value)
  values (
    v_company,
    v_profile,
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['companies','profiles','vehicles','employees','equipments','obligations','documents','actions']
  loop
    execute format(
      'create trigger set_updated_at_%1$s before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- audit triggers sur les entités clés
create trigger audit_obligations after insert or update or delete on public.obligations
  for each row execute function public.log_audit();
create trigger audit_actions after insert or update or delete on public.actions
  for each row execute function public.log_audit();
create trigger audit_documents after insert or update or delete on public.documents
  for each row execute function public.log_audit();

-- ---------------------------------------------------------------------
-- RPC statistiques du tableau de bord (regroupe tous les compteurs)
-- ---------------------------------------------------------------------
create or replace function public.get_dashboard_stats(p_company_id uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  result json;
begin
  -- Sécurité : on ne retourne que les stats de la company de l'utilisateur
  if p_company_id is null or p_company_id <> public.auth_company_id() then
    return json_build_object('error', 'forbidden');
  end if;

  select json_build_object(
    'obligations_ok', count(*) filter (
      where not o.is_archived and (o.due_date is null or o.due_date > current_date + 30)),
    'obligations_soon', count(*) filter (
      where not o.is_archived and o.due_date between current_date and current_date + 30),
    'obligations_expired', count(*) filter (
      where not o.is_archived and o.due_date < current_date),
    'obligations_total', count(*) filter (where not o.is_archived),
    'obligations_without_responsible', count(*) filter (
      where not o.is_archived and o.responsible_id is null),
    'missing_documents', count(*) filter (
      where not o.is_archived and not exists (
        select 1 from public.documents d
        where d.obligation_id = o.id and not d.is_archived))
  ) into result
  from public.obligations o
  where o.company_id = p_company_id;

  select json_build_object(
    'stats', result,
    'overdue_actions', (
      select count(*) from public.actions a
      where a.company_id = p_company_id and not a.is_archived
        and a.status <> 'termine' and a.due_date < current_date),
    'pending_notifications', (
      select count(*) from public.notifications n
      where n.company_id = p_company_id and not n.is_read),
    'expired_documents', (
      select count(*) from public.documents d
      where d.company_id = p_company_id and not d.is_archived
        and d.expiration_date < current_date)
  ) into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.companies      enable row level security;
alter table public.profiles       enable row level security;
alter table public.vehicles       enable row level security;
alter table public.employees      enable row level security;
alter table public.equipments     enable row level security;
alter table public.obligations    enable row level security;
alter table public.documents      enable row level security;
alter table public.actions        enable row level security;
alter table public.notifications  enable row level security;
alter table public.imports        enable row level security;
alter table public.audit_logs     enable row level security;
alter table public.pilot_leads    enable row level security;

-- companies : lecture de sa propre company, admin peut modifier
create policy company_select on public.companies
  for select using (id = public.auth_company_id());
create policy company_update on public.companies
  for update using (id = public.auth_company_id() and public.auth_role() = 'ADMIN_COMPANY');

-- profiles : voir les profils de sa company ; modifier son propre profil ; admin gère tout
create policy profiles_select on public.profiles
  for select using (company_id = public.auth_company_id());
create policy profiles_insert on public.profiles
  for insert with check (company_id = public.auth_company_id() and public.auth_role() = 'ADMIN_COMPANY');
create policy profiles_update on public.profiles
  for update using (
    company_id = public.auth_company_id()
    and (user_id = auth.uid() or public.auth_role() = 'ADMIN_COMPANY'));

-- Macro : politique standard "données de ma company" pour les tables métier
-- select pour tous les membres, write pour les non-VIEWER.
do $$
declare t text;
begin
  foreach t in array array['vehicles','employees','equipments','obligations','documents','actions','imports']
  loop
    execute format($f$
      create policy %1$s_select on public.%1$s
        for select using (company_id = public.auth_company_id());
      create policy %1$s_insert on public.%1$s
        for insert with check (company_id = public.auth_company_id() and public.auth_can_write());
      create policy %1$s_update on public.%1$s
        for update using (company_id = public.auth_company_id() and public.auth_can_write());
      create policy %1$s_delete on public.%1$s
        for delete using (company_id = public.auth_company_id() and public.auth_role() = 'ADMIN_COMPANY');
    $f$, t);
  end loop;
end $$;

-- notifications : chacun voit les siennes (ou celles de sa company si user_id null)
create policy notifications_select on public.notifications
  for select using (
    company_id = public.auth_company_id()
    and (user_id is null or user_id = (select id from public.profiles where user_id = auth.uid())));
create policy notifications_update on public.notifications
  for update using (company_id = public.auth_company_id());
create policy notifications_insert on public.notifications
  for insert with check (company_id = public.auth_company_id());

-- audit_logs : lecture seule pour la company
create policy audit_select on public.audit_logs
  for select using (company_id = public.auth_company_id());

-- pilot_leads : insertion publique (formulaire landing), aucune lecture publique
create policy pilot_leads_insert on public.pilot_leads
  for insert to anon, authenticated with check (true);

-- ---------------------------------------------------------------------
-- Storage : bucket documents + policies scoping par company (préfixe = company_id)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.auth_company_id()::text);

create policy "documents_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.auth_company_id()::text);

create policy "documents_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.auth_company_id()::text);
