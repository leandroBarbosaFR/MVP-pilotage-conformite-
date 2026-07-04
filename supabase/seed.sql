-- =====================================================================
-- Données de démonstration — TransPilot Demo
-- Approche : une fonction RPC remplit la company de l'utilisateur courant.
-- 1) Exécutez ce fichier une fois dans le SQL Editor Supabase.
-- 2) Connectez-vous à l'app puis Paramètres > "Charger les données de démo"
--    (ou appelez select public.load_demo_data(); en étant authentifié).
-- Nécessite les migrations 0001, 0002 et 0003.
-- =====================================================================

create or replace function public.load_demo_data()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid := public.auth_company_id();
  v_profile uuid;
  veh uuid[] := '{}';
  emp uuid[] := '{}';
  eqp uuid[] := '{}';
  obs uuid[] := '{}';
  i    int;
  vid  uuid;
  eid  uuid;
  qid  uuid;
  oid  uuid;
  d    date;
  st   compliance_status;
  -- Équipe de démonstration (membres invités, sans compte de connexion)
  p_admin uuid; p_qhse uuid; p_maint uuid; p_rh uuid;
  p_parc uuid; p_expl uuid; p_sup uuid; p_user uuid;
  s1 uuid; s2 uuid; s3 uuid;
  pr1 uuid; pr2 uuid; pr3 uuid; pr4 uuid; pr5 uuid; pr6 uuid;
begin
  if v_company is null then
    return 'Aucune entreprise associée à cet utilisateur.';
  end if;
  select id into v_profile from public.profiles where user_id = auth.uid();

  -- Ne pas dupliquer si déjà chargé
  if exists (select 1 from public.vehicles where company_id = v_company) then
    return 'Données déjà présentes.';
  end if;

  update public.companies
     set name = 'TransPilot Demo',
         sector = 'Transport / Logistique',
         employee_count = '100 à 250'
   where id = v_company;

  -- L'utilisateur courant devient ADMIN de la démo
  update public.profiles set role = 'ADMIN' where id = v_profile;

  -- Équipe de démonstration (profils sans user_id : membres invités)
  insert into public.profiles (company_id, first_name, last_name, email, role, job_title, is_active) values
    (v_company,'Emma','Admin','emma.admin@transpilot-demo.fr','ADMIN','Direction',true) returning id into p_admin;
  insert into public.profiles (company_id, first_name, last_name, email, role, job_title, is_active) values
    (v_company,'Claire','QHSE','claire.qhse@transpilot-demo.fr','QHSE_MANAGER','Responsable QHSE',true) returning id into p_qhse;
  insert into public.profiles (company_id, first_name, last_name, email, role, job_title, is_active) values
    (v_company,'Marc','Maintenance','marc.maintenance@transpilot-demo.fr','MAINTENANCE_MANAGER','Responsable maintenance',true) returning id into p_maint;
  insert into public.profiles (company_id, first_name, last_name, email, role, job_title, is_active) values
    (v_company,'Sophie','RH','sophie.rh@transpilot-demo.fr','HR_MANAGER','Responsable RH',true) returning id into p_rh;
  insert into public.profiles (company_id, first_name, last_name, email, role, job_title, is_active) values
    (v_company,'Julien','Parc','julien.parc@transpilot-demo.fr','FLEET_MANAGER','Responsable parc',true) returning id into p_parc;
  insert into public.profiles (company_id, first_name, last_name, email, role, job_title, is_active) values
    (v_company,'Nadia','Exploitation','nadia.exploitation@transpilot-demo.fr','OPERATIONS_MANAGER','Responsable exploitation',true) returning id into p_expl;
  insert into public.profiles (company_id, first_name, last_name, email, role, job_title, is_active) values
    (v_company,'Paul','Superviseur','paul.superviseur@transpilot-demo.fr','SUPERVISOR','Superviseur',true) returning id into p_sup;
  insert into public.profiles (company_id, first_name, last_name, email, role, job_title, is_active) values
    (v_company,'Utilisateur','Démo','user.demo@transpilot-demo.fr','USER','Opérateur',true) returning id into p_user;

  -- Réglages de notifications par défaut pour le tenant
  insert into public.notification_settings (tenant_id) values (v_company)
    on conflict (tenant_id) do nothing;

  -- Véhicules (10)
  for i in 1..10 loop
    insert into public.vehicles (company_id, registration_number, vehicle_type, brand, model, service_date, status, responsible_id, supervisor_id)
    values (
      v_company,
      'AA-' || lpad(i::text, 3, '0') || '-BB',
      (array['Poids lourd','Utilitaire','Tracteur routier','Fourgon'])[1 + (i % 4)],
      (array['Renault','Volvo','MAN','Iveco','Mercedes'])[1 + (i % 5)],
      'Série ' || i,
      current_date - (i * 130),
      (array['actif','actif','maintenance'])[1 + (i % 3)],
      p_parc, p_expl
    ) returning id into vid;
    veh := array_append(veh, vid);
  end loop;

  -- Conducteurs / salariés (8)
  for i in 1..8 loop
    insert into public.employees (company_id, first_name, last_name, job_title, email, phone, status, responsible_id, supervisor_id)
    values (
      v_company,
      (array['Marc','Julie','Karim','Sophie','Paul','Nadia','Éric','Lucas'])[i],
      (array['Durand','Petit','Benali','Moreau','Girard','Haddad','Lefevre','Roy'])[i],
      (array['Conducteur PL','Conductrice PL','Cariste','Exploitation','Conducteur SPL','Magasinier','Conducteur PL','Mécanicien'])[i],
      'salarie' || i || '@transpilot-demo.fr',
      '06 00 00 00 0' || i,
      'actif', p_rh, p_qhse
    ) returning id into eid;
    emp := array_append(emp, eid);
  end loop;

  -- Équipements (6)
  for i in 1..6 loop
    insert into public.equipments (company_id, name, equipment_type, site, internal_reference, status, responsible_id, supervisor_id)
    values (
      v_company,
      (array['Hayon élévateur','Chariot élévateur','Pont roulant','Compresseur','Groupe froid','Transpalette'])[i],
      (array['Levage','Manutention','Levage','Pneumatique','Froid','Manutention'])[i],
      (array['Dépôt Nord','Dépôt Sud','Atelier','Atelier','Dépôt Nord','Quai 3'])[i],
      'EQ-' || lpad(i::text, 4, '0'),
      'actif', p_maint, p_qhse
    ) returning id into qid;
    eqp := array_append(eqp, qid);
  end loop;

  -- EPI (8) — assignés aux salariés, renouvellements variés
  for i in 1..8 loop
    insert into public.epi (company_id, epi_type, internal_reference, assigned_employee_id, issue_date, renewal_date, status, responsible_id, supervisor_id)
    values (
      v_company,
      (array['Casque','Harnais','Chaussures de sécurité','Détecteur de gaz','Gants','Lunettes','Protections auditives','Casque'])[i],
      'EPI-' || lpad(i::text, 4, '0'),
      emp[i],
      current_date - (i * 40),
      current_date + (array[-20,10,25,90,180,-5,45,300])[i],
      'actif', p_qhse, p_qhse
    );
  end loop;

  -- Obligations (20) — échéances et statuts variés
  for i in 1..20 loop
    d := current_date + (array[-40,-10,5,12,25,60,120,-3,18,200])[1 + (i % 10)];
    if d < current_date then st := 'EXPIRED';
    elsif d <= current_date + 30 then st := 'EXPIRING_SOON';
    else st := 'COMPLIANT';
    end if;

    insert into public.obligations (company_id, title, category, description, due_date, frequency, priority, status, responsible_id, supervisor_id, linked_vehicle_id, linked_employee_id, linked_equipment_id, module, related_entity_type, related_entity_id)
    values (
      v_company,
      (array[
        'Contrôle technique','Assurance véhicule','Tachygraphe','Extincteur véhicule',
        'Visite médicale','Renouvellement permis','FIMO','FCO',
        'Vérification levage','Contrôle réglementaire équipement','Maintenance préventive','Audit interne QHSE',
        'Habilitation électrique','Formation ADR','EPI - dotation','Contrôle extincteurs site',
        'Visite périodique','Carte conducteur','Contrôle pollution','Registre de sécurité'
      ])[i],
      (array['vehicule','vehicule','vehicule','conducteur','conducteur','conducteur','equipement','equipement','audit','formation','vehicule','site'])[1 + (i % 12)],
      'Obligation de conformité à suivre — échéance de référence.',
      d,
      (array['annuelle','annuelle','semestrielle','trimestrielle','unique'])[1 + (i % 5)],
      (array['LOW','MEDIUM','CRITICAL'])[1 + (i % 3)]::priority_level,
      st,
      case when i % 5 = 0 then null else p_qhse end, -- quelques obligations sans responsable
      p_qhse,
      case when i % 3 = 0 then veh[1 + (i % array_length(veh, 1))] end,
      case when i % 3 = 1 then emp[1 + (i % array_length(emp, 1))] end,
      case when i % 3 = 2 then eqp[1 + (i % array_length(eqp, 1))] end,
      (case when i % 3 = 0 then 'VEHICLES' when i % 3 = 1 then 'PERSONNEL' else 'EQUIPMENT' end)::obligation_module,
      (case when i % 3 = 0 then 'VEHICLE' when i % 3 = 1 then 'EMPLOYEE' else 'EQUIPMENT' end)::related_entity_type,
      case when i % 3 = 0 then veh[1 + (i % array_length(veh, 1))]
           when i % 3 = 1 then emp[1 + (i % array_length(emp, 1))]
           else eqp[1 + (i % array_length(eqp, 1))] end
    ) returning id into oid;
    obs := array_append(obs, oid);
  end loop;

  -- Documents (10) — certains expirés, certains manquants (obligations sans doc)
  for i in 1..10 loop
    insert into public.documents (company_id, title, document_type, expiration_date, status, obligation_id, vehicle_id, responsible_id, supervisor_id, uploaded_by)
    values (
      v_company,
      (array['CT_2025.pdf','Attestation_assurance.pdf','Carte_tachy.pdf','Certificat_extincteur.pdf','Visite_medicale.pdf','Permis.pdf','FIMO.pdf','Rapport_levage.pdf','PV_controle.pdf','Registre.pdf'])[i],
      (array['Contrôle','Assurance','Carte','Certificat','Médical','Permis','Formation','Rapport','PV','Registre'])[i],
      current_date + (array[-30,-5,90,180,-15,45,300,20,-2,150])[i],
      case when (array[-30,-5,90,180,-15,45,300,20,-2,150])[i] < 0 then 'EXPIRED' else 'COMPLIANT' end,
      obs[i],
      case when i % 2 = 0 then veh[1 + (i % array_length(veh, 1))] end,
      p_qhse, p_qhse,
      v_profile
    );
  end loop;

  -- Actions génériques (15) — statuts variés dont en retard
  for i in 1..15 loop
    insert into public.actions (company_id, title, description, status, priority, due_date, assigned_to, supervisor_id, obligation_id, created_by)
    values (
      v_company,
      (array[
        'Planifier une visite médicale','Renouveler un permis','Contrôler un extincteur',
        'Programmer une vérification réglementaire','Demander un document manquant','Relancer un salarié',
        'Uploader une preuve de contrôle','Planifier le contrôle technique','Vérifier le tachygraphe',
        'Mettre à jour la carte conducteur','Contrôle levage à programmer','Renouveler la FCO',
        'Audit interne à préparer','Remplacer un EPI','Archiver un ancien PV'
      ])[i],
      'Tâche à réaliser pour rester conforme.',
      (array['LATE','TODO','IN_PROGRESS','DONE','TODO'])[1 + (i % 5)]::action_status,
      (array['LOW','MEDIUM','CRITICAL'])[1 + (i % 3)]::priority_level,
      current_date + (array[-12,-2,3,10,30,-20,45])[1 + (i % 7)],
      p_maint, p_qhse,
      obs[1 + (i % array_length(obs, 1))],
      v_profile
    );
  end loop;

  -- Actions d'exemple ciblées (responsables / superviseurs métier)
  insert into public.actions (company_id, title, category, description, status, priority, due_date, assigned_to, supervisor_id, created_by) values
    (v_company,'Renouveler habilitation électrique - 4 salariés','RH','Habilitations à renouveler avant échéance.','TODO','CRITICAL',current_date,        p_rh,   p_qhse, v_profile),
    (v_company,'Contrôle chariot élévateur CH-12','Maintenance','Vérification réglementaire du chariot élévateur.','TODO','CRITICAL',current_date + 3, p_maint,p_qhse, v_profile),
    (v_company,'Ajouter rapport extincteurs atelier','Maintenance','Téléverser le rapport de contrôle des extincteurs.','PLANNED','HIGH',current_date + 15, p_maint,p_qhse, v_profile),
    (v_company,'Vérifier assurance véhicule AB-123-CD','Parc','Contrôler la validité de l''assurance du véhicule.','TODO','HIGH',current_date + 10,   p_parc, p_expl, v_profile),
    (v_company,'Planifier visite médecine du travail','RH','Programmer les visites médicales à venir.','PLANNED','MEDIUM',current_date + 21,      p_rh,   p_qhse, v_profile);

  -- Notifications (6)
  for i in 1..6 loop
    insert into public.notifications (company_id, user_id, title, message, type, priority, is_read)
    values (
      v_company, v_profile,
      (array['Visite médicale à planifier','Contrôle machine à réaliser','Document expiré','Permis bientôt expiré','Preuve manquante','Action en retard'])[i],
      'Échéance ou action nécessitant votre attention.',
      (array['DUE_SOON','CONTROL_TO_PLAN','EXPIRED','DUE_SOON','MISSING_DOCUMENT','ACTION_LATE'])[i]::notification_type,
      (array['MEDIUM','HIGH','CRITICAL','MEDIUM','HIGH','CRITICAL'])[i]::priority_level,
      (i > 4)
    );
  end loop;

  -- Sites et locaux (3)
  insert into public.sites (company_id, name, site_type, city, postal_code, country, surface_area, activity_type, manager_id, supervisor_id)
  values (v_company,'Entrepôt Marseille','Entrepôt','Marseille','13011','France',4200,'Logistique',p_expl,p_qhse) returning id into s1;
  insert into public.sites (company_id, name, site_type, city, postal_code, country, surface_area, activity_type, manager_id, supervisor_id)
  values (v_company,'Bureau Lyon','Bureau','Lyon','69003','France',650,'Administratif',p_admin,p_qhse) returning id into s2;
  insert into public.sites (company_id, name, site_type, city, postal_code, country, surface_area, activity_type, manager_id, supervisor_id)
  values (v_company,'Atelier maintenance','Atelier','Vénissieux','69200','France',1800,'Maintenance',p_maint,p_qhse) returning id into s3;

  -- Prestataires (6)
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country)
  values (v_company,'SécuriFeu Contrôles','Maintenance extincteurs','M. Fabre','contact@securifeu.fr','04 91 00 00 01','Marseille','France') returning id into pr1;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country)
  values (v_company,'ElecCheck Pro','Maintenance électrique','Mme Roy','contact@eleccheck.fr','04 72 00 00 02','Lyon','France') returning id into pr2;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country)
  values (v_company,'Garage Transport Services','Maintenance véhicules','M. Léon','contact@gts.fr','04 72 00 00 03','Vénissieux','France') returning id into pr3;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country)
  values (v_company,'Médecine du Travail Régionale','Médecine du travail','Dr. Meyer','contact@mtr.fr','04 78 00 00 04','Lyon','France') returning id into pr4;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country)
  values (v_company,'Formation Sécurité Plus','Organisme de formation','Mme Aziz','contact@fsp.fr','04 91 00 00 05','Marseille','France') returning id into pr5;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country)
  values (v_company,'Assurance Pro Entreprise','Assurance','M. Blanc','contact@ape.fr','01 40 00 00 06','Paris','France') returning id into pr6;

  -- Contrats (6)
  insert into public.contracts (company_id, title, contract_type, provider_id, site_id, start_date, end_date, renewal_date, notice_period_days, amount, currency, responsible_id, supervisor_id, status)
  values
    (v_company,'Contrat maintenance extincteurs','Maintenance extincteurs',pr1,s1,current_date-365,current_date+45,current_date+45,30,4800,'EUR',p_qhse,p_admin,'ACTIVE'),
    (v_company,'Contrat alarme incendie','Maintenance alarme',pr1,s1,current_date-300,current_date+20,current_date+20,30,3600,'EUR',p_qhse,p_admin,'TO_RENEW'),
    (v_company,'Assurance multirisque locaux','Assurance multirisque',pr6,s2,current_date-365,current_date+90,current_date+90,60,12000,'EUR',p_qhse,p_admin,'ACTIVE'),
    (v_company,'Contrat entretien véhicules','Maintenance véhicules',pr3,s3,current_date-200,current_date+130,current_date+130,30,7800,'EUR',p_parc,p_expl,'ACTIVE'),
    (v_company,'Contrat médecine du travail','Médecine du travail',pr4,s2,current_date-365,current_date+12,current_date+12,30,2400,'EUR',p_rh,p_qhse,'TO_RENEW'),
    (v_company,'Contrat maintenance électrique','Maintenance électrique',pr2,s3,current_date-400,current_date-8,current_date-8,30,5200,'EUR',p_maint,p_qhse,'EXPIRED');

  -- Audits et inspections (4)
  insert into public.audits (company_id, title, audit_type, site_id, auditor_name, planned_date, completed_date, status, result, score, responsible_id, supervisor_id)
  values
    (v_company,'Audit sécurité semestriel','Audit sécurité',s1,'Cabinet QHSE Conseil',current_date-20,current_date-18,'DONE','MINOR_NC',82,p_qhse,p_admin),
    (v_company,'Audit client logistique','Audit client',s1,'Cabinet QHSE Conseil',current_date+5,null,'IN_PROGRESS',null,null,p_qhse,p_admin),
    (v_company,'Inspection interne entrepôt','Audit interne',s1,'Cabinet QHSE Conseil',current_date+30,null,'PLANNED',null,null,p_qhse,p_admin),
    (v_company,'Visite sécurité atelier','Visite sécurité',s3,'Cabinet QHSE Conseil',current_date-5,null,'LATE',null,null,p_maint,p_qhse);

  -- Non-conformités (5)
  insert into public.non_conformities (company_id, title, description, severity, source_type, site_id, detected_at, responsible_id, supervisor_id, status)
  values
    (v_company,'Registre sécurité non mis à jour','Écart constaté à traiter.','MEDIUM','Audit',s1,current_date-10,p_qhse,p_admin,'OPEN'),
    (v_company,'Contrôle gaz expiré','Écart constaté à traiter.','HIGH','Contrôle',s3,current_date-25,p_maint,p_qhse,'IN_PROGRESS'),
    (v_company,'Rapport extincteurs manquant','Écart constaté à traiter.','MEDIUM','Document',s1,current_date-6,p_qhse,p_admin,'OPEN'),
    (v_company,'Pneus véhicule AB-123-CD à contrôler','Écart constaté à traiter.','HIGH','Véhicule',null,current_date-3,p_parc,p_expl,'OPEN'),
    (v_company,'Action corrective audit client non terminée','Écart constaté à traiter.','CRITICAL','Audit',s1,current_date-30,p_qhse,p_admin,'IN_PROGRESS');

  return 'Données de démonstration chargées : 8 membres, 3 sites, 6 prestataires, 6 contrats, 4 audits, 5 non-conformités, 10 véhicules, 8 conducteurs, 6 équipements, 8 EPI, 20 obligations, 10 documents, 20 actions, 6 notifications.';
end;
$$;
