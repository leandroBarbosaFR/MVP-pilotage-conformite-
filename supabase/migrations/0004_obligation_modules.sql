-- =====================================================================
-- Rattachement des obligations à leur module métier + entité liée.
-- Source de vérité unique : une obligation existe une fois, affichée
-- dans son module (module) et dans la vue consolidée Contrôles réglementaires.
-- Prudent : IF NOT EXISTS, backfill, aucune donnée supprimée.
-- =====================================================================

-- 1. Enums (créés seulement s'ils n'existent pas)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'obligation_module') then
    create type obligation_module as enum (
      'SITES','PERSONNEL','PPE','EQUIPMENT','VEHICLES','REGULATORY_CONTROLS',
      'DOCUMENTS','CONTRACTS','AUDITS','NON_CONFORMITIES','ACTIONS');
  end if;
  if not exists (select 1 from pg_type where typname = 'related_entity_type') then
    create type related_entity_type as enum (
      'SITE','EMPLOYEE','DRIVER','PPE','EQUIPMENT','VEHICLE','DOCUMENT',
      'CONTRACT','PROVIDER','AUDIT','NON_Pilotix','ACTION');
  end if;
end $$;

-- 2. Colonnes
alter table public.obligations add column if not exists module obligation_module;
alter table public.obligations add column if not exists related_entity_type related_entity_type;
alter table public.obligations add column if not exists related_entity_id uuid;
alter table public.obligations add column if not exists provider_id uuid;
alter table public.obligations add column if not exists notes text;

-- 3. Backfill entité liée à partir des colonnes linked_*
update public.obligations set
  related_entity_type = (case
    when linked_vehicle_id   is not null then 'VEHICLE'
    when linked_employee_id  is not null then 'EMPLOYEE'
    when linked_equipment_id is not null then 'EQUIPMENT'
  end)::related_entity_type,
  related_entity_id = coalesce(linked_vehicle_id, linked_employee_id, linked_equipment_id)
where related_entity_id is null
  and (linked_vehicle_id is not null or linked_employee_id is not null or linked_equipment_id is not null);

-- 4. Backfill module (linked_* prioritaire, sinon catégorie)
update public.obligations set module = (case
    when linked_vehicle_id   is not null or category = 'vehicule'   then 'VEHICLES'
    when linked_employee_id  is not null or category = 'conducteur' then 'PERSONNEL'
    when linked_equipment_id is not null or category = 'equipement' then 'EQUIPMENT'
    when category = 'site'      then 'SITES'
    when category = 'document'  then 'DOCUMENTS'
    when category = 'audit'     then 'AUDITS'
    when category = 'formation' then 'PERSONNEL'
    else 'REGULATORY_CONTROLS'
  end)::obligation_module
where module is null;

-- 5. Défaut + NOT NULL
update public.obligations set module = 'REGULATORY_CONTROLS' where module is null;
alter table public.obligations alter column module set default 'REGULATORY_CONTROLS';
alter table public.obligations alter column module set not null;

create index if not exists obligations_module_idx on public.obligations (module);
create index if not exists obligations_related_entity_idx on public.obligations (related_entity_type, related_entity_id);
