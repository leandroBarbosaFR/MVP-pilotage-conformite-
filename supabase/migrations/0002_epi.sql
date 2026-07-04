-- =====================================================================
-- Module EPI — Équipements de protection individuelle
-- Table `epi` + lien documents.epi_id + RLS + triggers
-- =====================================================================

create table public.epi (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  epi_type            text not null,                       -- Casque, Harnais, Chaussures…
  internal_reference  text,                                -- référence interne
  assigned_employee_id uuid references public.employees(id) on delete set null,
  issue_date          date,                                -- date de remise
  renewal_date        date,                                -- date de renouvellement
  status              text not null default 'actif',
  responsible_id      uuid references public.profiles(id) on delete set null,
  supervisor_id       uuid references public.profiles(id) on delete set null,
  is_archived         boolean not null default false,
  archived_at         timestamptz,
  archived_by         uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on public.epi (company_id);
create index on public.epi (renewal_date);

-- Lien optionnel document -> EPI (document associé)
alter table public.documents
  add column if not exists epi_id uuid references public.epi(id) on delete set null;
create index on public.documents (epi_id);

-- updated_at + audit
create trigger set_updated_at_epi before update on public.epi
  for each row execute function public.set_updated_at();
create trigger audit_epi after insert or update or delete on public.epi
  for each row execute function public.log_audit();

-- RLS : mêmes règles que les autres tables métier
alter table public.epi enable row level security;

create policy epi_select on public.epi
  for select using (company_id = public.auth_company_id());
create policy epi_insert on public.epi
  for insert with check (company_id = public.auth_company_id() and public.auth_can_write());
create policy epi_update on public.epi
  for update using (company_id = public.auth_company_id() and public.auth_can_write());
create policy epi_delete on public.epi
  for delete using (company_id = public.auth_company_id() and public.auth_role() = 'ADMIN_COMPANY');
