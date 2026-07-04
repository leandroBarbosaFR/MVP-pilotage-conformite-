-- =====================================================================
-- Rôles, permissions, responsables/superviseurs, notifications internes
-- Migration prudente : aucune table supprimée, aucune donnée effacée.
-- « tenant » = companies (schéma existant). Supabase Auth reste la source
-- d'authentification ; profiles porte le rôle et le rattachement tenant.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nouveaux types enum (valeurs anglaises)
-- ---------------------------------------------------------------------
create type action_status_new as enum
  ('TODO','IN_PROGRESS','PLANNED','WAITING','DONE','LATE','CANCELLED','ARCHIVED');
create type priority_level_new as enum
  ('LOW','MEDIUM','HIGH','CRITICAL');
create type compliance_status as enum
  ('COMPLIANT','TO_WATCH','EXPIRING_SOON','EXPIRED','MISSING_DOCUMENT','LATE','ARCHIVED');
create type notification_type as enum
  ('DUE_SOON','EXPIRED','MISSING_DOCUMENT','ACTION_ASSIGNED','ACTION_LATE',
   'DOCUMENT_ADDED','COMMENT_ADDED','CONTROL_TO_PLAN','SUPERVISOR_ALERT');

-- ---------------------------------------------------------------------
-- 2. user_role : migration de l'enum + recréation fonctions & policies
--    Anciennes valeurs -> nouvelles : ADMIN_COMPANY→ADMIN,
--    RESPONSIBLE/VIEWER→USER, SUPERVISOR conservé.
-- ---------------------------------------------------------------------
-- Retirer les fonctions de rôle (CASCADE retire les policies qui les utilisent)
drop function if exists public.auth_can_write() cascade; -- policies *_insert / *_update
drop function if exists public.auth_role() cascade;       -- companies_update, profiles_*, *_delete

alter table public.profiles alter column role drop default;

create type user_role_new as enum
  ('ADMIN','QHSE_MANAGER','HR_MANAGER','MAINTENANCE_MANAGER',
   'FLEET_MANAGER','OPERATIONS_MANAGER','SUPERVISOR','USER');

alter table public.profiles
  alter column role type user_role_new using (
    case role::text
      when 'ADMIN_COMPANY' then 'ADMIN'
      when 'SUPERVISOR'    then 'SUPERVISOR'
      when 'RESPONSIBLE'   then 'USER'
      when 'VIEWER'        then 'USER'
      else 'USER'
    end::user_role_new);

drop type public.user_role;
alter type public.user_role_new rename to user_role;
alter table public.profiles alter column role set default 'USER';

-- Helpers de rôle (recréés avec les nouveaux rôles)
create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.auth_can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in (
    'ADMIN','QHSE_MANAGER','HR_MANAGER','MAINTENANCE_MANAGER',
    'FLEET_MANAGER','OPERATIONS_MANAGER'), false);
$$;

create or replace function public.auth_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() = 'ADMIN', false);
$$;

-- Profil courant (id + tenant + rôle) pour l'application
create or replace function public.current_user_profile()
returns table (profile_id uuid, tenant_id uuid, role user_role)
language sql stable security definer set search_path = public as $$
  select id, company_id, role from public.profiles where user_id = auth.uid() limit 1;
$$;

-- Le premier utilisateur d'une entreprise devient ADMIN
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
    'ADMIN'
  );
  return new;
end;
$$;

-- Recréer les policies d'écriture / suppression (retirées par le CASCADE)
do $$
declare t text;
begin
  foreach t in array array['vehicles','employees','equipments','epi','obligations','documents','actions','imports']
  loop
    execute format($f$
      create policy %1$s_insert on public.%1$s
        for insert with check (company_id = public.auth_company_id() and public.auth_can_write());
      create policy %1$s_update on public.%1$s
        for update using (company_id = public.auth_company_id() and public.auth_can_write());
      create policy %1$s_delete on public.%1$s
        for delete using (company_id = public.auth_company_id() and public.auth_is_admin());
    $f$, t);
  end loop;
end $$;

create policy company_update on public.companies
  for update using (id = public.auth_company_id() and public.auth_is_admin());
create policy profiles_insert on public.profiles
  for insert with check (company_id = public.auth_company_id() and public.auth_is_admin());
create policy profiles_update on public.profiles
  for update using (
    company_id = public.auth_company_id()
    and (user_id = auth.uid() or public.auth_is_admin()));

-- ---------------------------------------------------------------------
-- 3. action_status : swap vers valeurs anglaises
-- ---------------------------------------------------------------------
alter table public.actions alter column status drop default;
alter table public.actions
  alter column status type action_status_new using (
    case status::text
      when 'a_faire'   then 'TODO'
      when 'en_cours'  then 'IN_PROGRESS'
      when 'termine'   then 'DONE'
      when 'en_retard' then 'LATE'
      when 'archive'   then 'ARCHIVED'
      else 'TODO'
    end::action_status_new);
drop type public.action_status;
alter type public.action_status_new rename to action_status;
alter table public.actions alter column status set default 'TODO';

-- ---------------------------------------------------------------------
-- 4. priority_level : swap (obligations.priority + actions.priority)
-- ---------------------------------------------------------------------
alter table public.obligations alter column priority drop default;
alter table public.actions alter column priority drop default;
alter table public.obligations
  alter column priority type priority_level_new using (
    case priority::text when 'faible' then 'LOW' when 'moyen' then 'MEDIUM'
      when 'critique' then 'CRITICAL' else 'MEDIUM' end::priority_level_new);
alter table public.actions
  alter column priority type priority_level_new using (
    case priority::text when 'faible' then 'LOW' when 'moyen' then 'MEDIUM'
      when 'critique' then 'CRITICAL' else 'MEDIUM' end::priority_level_new);
drop type public.priority_level;
alter type public.priority_level_new rename to priority_level;
alter table public.obligations alter column priority set default 'MEDIUM';
alter table public.actions alter column priority set default 'MEDIUM';

-- ---------------------------------------------------------------------
-- 5. obligations.status : obligation_status -> compliance_status
-- ---------------------------------------------------------------------
alter table public.obligations alter column status drop default;
alter table public.obligations
  alter column status type compliance_status using (
    case status::text
      when 'a_jour'          then 'COMPLIANT'
      when 'bientot_expire'  then 'EXPIRING_SOON'
      when 'expire'          then 'EXPIRED'
      when 'archive'         then 'ARCHIVED'
      else 'COMPLIANT'
    end::compliance_status);
drop type public.obligation_status;
alter table public.obligations alter column status set default 'COMPLIANT';

-- ---------------------------------------------------------------------
-- 6. notifications : type texte -> enum + nouvelles colonnes
-- ---------------------------------------------------------------------
alter table public.notifications
  alter column type type notification_type using (
    case
      when type = 'echeance' then 'DUE_SOON'
      when type = 'document' then 'MISSING_DOCUMENT'
      when type = 'action'   then 'ACTION_LATE'
      when type is null      then null
      else 'DUE_SOON'
    end::notification_type);

alter table public.notifications add column if not exists priority priority_level;
alter table public.notifications add column if not exists related_entity_type text;
alter table public.notifications add column if not exists related_entity_id uuid;
alter table public.notifications add column if not exists read_at timestamptz;

-- ---------------------------------------------------------------------
-- 7. profiles : job_title, is_active ; user_id nullable (membres invités)
-- ---------------------------------------------------------------------
alter table public.profiles alter column user_id drop not null;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists is_active boolean not null default true;
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_is_active_idx on public.profiles(is_active);

-- ---------------------------------------------------------------------
-- 8. actions : assigned_to + champs de suivi
-- ---------------------------------------------------------------------
alter table public.actions rename column responsible_id to assigned_to;
alter table public.actions add column if not exists category text;
alter table public.actions add column if not exists related_entity_type text;
alter table public.actions add column if not exists related_entity_id uuid;
alter table public.actions add column if not exists completed_at timestamptz;
alter table public.actions add column if not exists completed_by uuid references public.profiles(id) on delete set null;
alter table public.actions add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.actions add column if not exists archive_reason text;
create index if not exists actions_assigned_to_idx on public.actions(assigned_to);
create index if not exists actions_supervisor_id_idx on public.actions(supervisor_id);
create index if not exists actions_status_idx on public.actions(status);

-- ---------------------------------------------------------------------
-- 9. documents : responsable + superviseur
-- ---------------------------------------------------------------------
alter table public.documents add column if not exists responsible_id uuid references public.profiles(id) on delete set null;
alter table public.documents add column if not exists supervisor_id uuid references public.profiles(id) on delete set null;

-- Index responsable/superviseur sur les tables métier
create index if not exists vehicles_responsible_idx on public.vehicles(responsible_id);
create index if not exists employees_responsible_idx on public.employees(responsible_id);
create index if not exists equipments_responsible_idx on public.equipments(responsible_id);
create index if not exists epi_responsible_idx on public.epi(responsible_id);
create index if not exists obligations_responsible_idx on public.obligations(responsible_id);
create index if not exists obligations_supervisor_idx on public.obligations(supervisor_id);

-- ---------------------------------------------------------------------
-- 10. notification_settings (une ligne par tenant)
-- ---------------------------------------------------------------------
create table if not exists public.notification_settings (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.companies(id) on delete cascade,
  alert_days_before_due integer not null default 30,
  notify_responsible    boolean not null default true,
  notify_supervisor     boolean not null default true,
  notify_admin          boolean not null default false,
  email_enabled         boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (tenant_id)
);
create index if not exists notification_settings_tenant_idx on public.notification_settings(tenant_id);

alter table public.notification_settings enable row level security;
create policy notification_settings_select on public.notification_settings
  for select using (tenant_id = public.auth_company_id());
create policy notification_settings_insert on public.notification_settings
  for insert with check (tenant_id = public.auth_company_id() and public.auth_can_write());
create policy notification_settings_update on public.notification_settings
  for update using (tenant_id = public.auth_company_id() and public.auth_can_write());
create trigger set_updated_at_notification_settings before update on public.notification_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 11. get_dashboard_stats : mise à jour du littéral de statut d'action
-- ---------------------------------------------------------------------
create or replace function public.get_dashboard_stats(p_company_id uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  result json;
begin
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
        and a.status <> 'DONE' and a.due_date < current_date),
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
