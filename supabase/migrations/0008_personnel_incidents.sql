-- =====================================================================
-- Phase 1 — Fondations de données : Personnel (certifications + absences),
-- Incidents, et enrichissement des tables métier existantes.
-- Prudent : IF NOT EXISTS, add column if not exists, aucune donnée supprimée.
-- « tenant » = companies. Mêmes helpers RLS que les migrations 0003/0005.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Correctif enum : NON_Pilotix -> NON_CONFORMITY (artefact d'un
--    ancien remplacement Conformity->Pilotix). RENAME VALUE conserve
--    les lignes existantes. Idempotent.
-- ---------------------------------------------------------------------
do $$ begin
  if exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'related_entity_type' and e.enumlabel = 'NON_Pilotix'
  ) then
    alter type related_entity_type rename value 'NON_Pilotix' to 'NON_CONFORMITY';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1. Nouveaux enums (guardés)
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'certification_type') then
    create type certification_type as enum (
      'FORMATION','HABILITATION','MEDICAL_VISIT','LICENSE','PPE',
      'AUTHORIZATION','APTITUDE','OTHER');
  end if;
  if not exists (select 1 from pg_type where typname = 'aptitude_status') then
    create type aptitude_status as enum (
      'FIT','FIT_WITH_RESTRICTIONS','TEMP_UNFIT','UNFIT');
  end if;
  if not exists (select 1 from pg_type where typname = 'incident_type') then
    create type incident_type as enum ('INCIDENT','NEAR_MISS','OBSERVATION');
  end if;
  if not exists (select 1 from pg_type where typname = 'incident_status') then
    create type incident_status as enum ('OPEN','IN_PROGRESS','CLOSED','ARCHIVED');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. Helper RLS : accès aux données personnel sensibles (absences/aptitude)
--    Restreint aux rôles autorisés (spec : « accès limité aux profils
--    autorisés », données de santé sensibles).
-- ---------------------------------------------------------------------
create or replace function public.auth_can_view_personnel()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in
    ('ADMIN','HR_MANAGER','OPERATIONS_MANAGER'), false);
$$;

-- ---------------------------------------------------------------------
-- 3. employee_certifications
--    Un élément par formation / habilitation / visite médicale / permis /
--    EPI / autorisation / aptitude, avec sa propre échéance.
-- ---------------------------------------------------------------------
create table if not exists public.employee_certifications (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  employee_id    uuid not null references public.employees(id) on delete cascade,
  type           certification_type not null default 'OTHER',
  category       text,                          -- CACES R489, habilitation élec, FIMO, SST…
  title          text not null,
  obtained_date  date,
  expiry_date    date,
  status         compliance_status not null default 'COMPLIANT',
  priority       priority_level not null default 'MEDIUM',
  document_id    uuid references public.documents(id) on delete set null,
  responsible_id uuid references public.profiles(id) on delete set null,
  supervisor_id  uuid references public.profiles(id) on delete set null,
  notes          text,
  is_archived    boolean not null default false,
  archived_at    timestamptz,
  archived_by    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists emp_certs_company_idx  on public.employee_certifications (company_id);
create index if not exists emp_certs_employee_idx on public.employee_certifications (employee_id);
create index if not exists emp_certs_expiry_idx   on public.employee_certifications (expiry_date);
create index if not exists emp_certs_type_idx     on public.employee_certifications (type);

-- ---------------------------------------------------------------------
-- 4. employee_absences
--    Suivi des absences et de l'aptitude au poste, SANS diagnostic médical.
-- ---------------------------------------------------------------------
create table if not exists public.employee_absences (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies(id) on delete cascade,
  employee_id           uuid not null references public.employees(id) on delete cascade,
  is_sick_leave         boolean not null default false,
  start_date            date,
  expected_end_date     date,
  return_date           date,
  work_status           text not null default 'absent',  -- en_poste/absent/arret_maladie/reprise_prevue/sorti
  aptitude              aptitude_status,
  restrictions          text,                            -- port de charge, conduite, horaires… (non médical)
  next_medical_visit    date,
  return_visit_required boolean not null default false,
  document_id           uuid references public.documents(id) on delete set null,
  responsible_id        uuid references public.profiles(id) on delete set null,
  internal_notes        text,                            -- notes internes non médicales
  is_archived           boolean not null default false,
  archived_at           timestamptz,
  archived_by           uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists emp_absences_company_idx  on public.employee_absences (company_id);
create index if not exists emp_absences_employee_idx on public.employee_absences (employee_id);
create index if not exists emp_absences_visit_idx    on public.employee_absences (next_medical_visit);

-- ---------------------------------------------------------------------
-- 5. incidents
--    Incidents, presque-accidents et observations sécurité. Distinct des
--    non-conformités (audit/contrôle) : ici événement terrain.
-- ---------------------------------------------------------------------
create table if not exists public.incidents (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  type                 incident_type not null default 'INCIDENT',
  title                text not null,
  description          text,
  site_id              uuid references public.sites(id) on delete set null,
  zone                 text,
  occurred_at          date,
  severity             priority_level not null default 'MEDIUM',
  status               incident_status not null default 'OPEN',
  responsible_id       uuid references public.profiles(id) on delete set null,
  supervisor_id        uuid references public.profiles(id) on delete set null,
  related_entity_type  related_entity_type,
  related_entity_id    uuid,
  corrective_action_id uuid references public.actions(id) on delete set null,
  document_id          uuid references public.documents(id) on delete set null,
  is_archived          boolean not null default false,
  archived_at          timestamptz,
  archived_by          uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists incidents_company_idx on public.incidents (company_id);
create index if not exists incidents_site_idx    on public.incidents (site_id);
create index if not exists incidents_status_idx  on public.incidents (status);

-- ---------------------------------------------------------------------
-- 6. Enrichissement des tables métier existantes (add column if not exists)
-- ---------------------------------------------------------------------
-- 6a. employees : contexte terrain transport/logistique
alter table public.employees add column if not exists job_family        text;   -- conducteur/cariste/agent de quai/exploitant/maintenance/administratif
alter table public.employees add column if not exists service           text;
alter table public.employees add column if not exists site_id           uuid references public.sites(id) on delete set null;
alter table public.employees add column if not exists contract_type     text;   -- CDI/CDD/interim/alternance/prestataire/autre
alter table public.employees add column if not exists hire_date         date;
alter table public.employees add column if not exists contract_end_date date;
alter table public.employees add column if not exists exit_date         date;
create index if not exists employees_site_idx on public.employees (site_id);

-- 6b. vehicles : échéances et rattachements flotte
alter table public.vehicles add column if not exists site_id                     uuid references public.sites(id) on delete set null;
alter table public.vehicles add column if not exists main_driver_id              uuid references public.employees(id) on delete set null;
alter table public.vehicles add column if not exists fleet_manager_id            uuid references public.profiles(id) on delete set null;
alter table public.vehicles add column if not exists insurance_expiry            date;
alter table public.vehicles add column if not exists technical_inspection_expiry date;
alter table public.vehicles add column if not exists last_maintenance            date;
alter table public.vehicles add column if not exists next_maintenance            date;
alter table public.vehicles add column if not exists mileage                     integer;
alter table public.vehicles add column if not exists tachograph_expiry           date;
alter table public.vehicles add column if not exists extinguisher_expiry         date;
alter table public.vehicles add column if not exists priority                    priority_level default 'MEDIUM';
alter table public.vehicles add column if not exists notes                       text;
create index if not exists vehicles_site_idx on public.vehicles (site_id);

-- 6c. equipments : contrôles périodiques, rattachement site/prestataire
alter table public.equipments add column if not exists category        text;
alter table public.equipments add column if not exists serial_number   text;
alter table public.equipments add column if not exists site_id         uuid references public.sites(id) on delete set null;
alter table public.equipments add column if not exists last_check_date date;
alter table public.equipments add column if not exists next_check_date date;
alter table public.equipments add column if not exists frequency       text;
alter table public.equipments add column if not exists provider_id     uuid references public.providers(id) on delete set null;
alter table public.equipments add column if not exists priority        priority_level default 'MEDIUM';
alter table public.equipments add column if not exists notes           text;
create index if not exists equipments_site_idx      on public.equipments (site_id);
create index if not exists equipments_next_check_idx on public.equipments (next_check_date);

-- 6d. providers : suivi conformité / relance
alter table public.providers add column if not exists responsible_id   uuid references public.profiles(id) on delete set null;
alter table public.providers add column if not exists site_id          uuid references public.sites(id) on delete set null;
alter table public.providers add column if not exists insurance_expiry date;
alter table public.providers add column if not exists priority         priority_level default 'MEDIUM';
alter table public.providers add column if not exists needs_followup   boolean not null default false;

-- 6e. documents : rattachement générique à toute entité
alter table public.documents add column if not exists site_id             uuid references public.sites(id) on delete set null;
alter table public.documents add column if not exists provider_id         uuid references public.providers(id) on delete set null;
alter table public.documents add column if not exists contract_id         uuid references public.contracts(id) on delete set null;
alter table public.documents add column if not exists audit_id            uuid references public.audits(id) on delete set null;
alter table public.documents add column if not exists incident_id         uuid references public.incidents(id) on delete set null;
alter table public.documents add column if not exists non_conformity_id   uuid references public.non_conformities(id) on delete set null;
alter table public.documents add column if not exists certification_id    uuid references public.employee_certifications(id) on delete set null;
alter table public.documents add column if not exists related_entity_type text;
alter table public.documents add column if not exists related_entity_id   uuid;
create index if not exists documents_site_idx     on public.documents (site_id);
create index if not exists documents_provider_idx on public.documents (provider_id);
create index if not exists documents_related_idx  on public.documents (related_entity_type, related_entity_id);

-- ---------------------------------------------------------------------
-- 7. updated_at triggers pour les nouvelles tables
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['employee_certifications','employee_absences','incidents']
  loop
    if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_' || t) then
      execute format(
        'create trigger set_updated_at_%1$s before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 8. RLS
-- ---------------------------------------------------------------------
-- 8a. employee_certifications + incidents : règles métier standard
do $$
declare t text;
begin
  foreach t in array array['employee_certifications','incidents']
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

-- 8b. employee_absences : lecture ET écriture restreintes (données sensibles)
alter table public.employee_absences enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'employee_absences' and policyname = 'employee_absences_select') then
    create policy employee_absences_select on public.employee_absences
      for select using (company_id = public.auth_company_id() and public.auth_can_view_personnel());
    create policy employee_absences_insert on public.employee_absences
      for insert with check (company_id = public.auth_company_id() and public.auth_can_view_personnel());
    create policy employee_absences_update on public.employee_absences
      for update using (company_id = public.auth_company_id() and public.auth_can_view_personnel());
    create policy employee_absences_delete on public.employee_absences
      for delete using (company_id = public.auth_company_id() and public.auth_is_admin());
  end if;
end $$;
