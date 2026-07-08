-- =====================================================================
-- Données de démonstration — TransPilot Demo (transport / logistique)
-- Approche : une fonction RPC remplit la company de l'utilisateur courant.
-- 1) Exécutez ce fichier une fois dans le SQL Editor Supabase.
-- 2) Connectez-vous à l'app puis Paramètres > "Charger les données de démo"
--    (ou appelez select public.load_demo_data(); en étant authentifié).
-- Nécessite les migrations 0001 à 0008.
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
  ct   int;
  ins  int;
  nxt  int;
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

  insert into public.notification_settings (tenant_id) values (v_company)
    on conflict (tenant_id) do nothing;

  -- Sites (3)
  insert into public.sites (company_id, name, site_type, city, postal_code, country, surface_area, activity_type, manager_id, supervisor_id)
  values (v_company,'Entrepôt Marseille','Entrepôt','Marseille','13011','France',4200,'Logistique',p_expl,p_qhse) returning id into s1;
  insert into public.sites (company_id, name, site_type, city, postal_code, country, surface_area, activity_type, manager_id, supervisor_id)
  values (v_company,'Bureau Lyon','Bureau','Lyon','69003','France',650,'Administratif',p_admin,p_qhse) returning id into s2;
  insert into public.sites (company_id, name, site_type, city, postal_code, country, surface_area, activity_type, manager_id, supervisor_id)
  values (v_company,'Atelier maintenance','Atelier','Vénissieux','69200','France',1800,'Maintenance',p_maint,p_qhse) returning id into s3;

  -- Prestataires (6)
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country, site_id, responsible_id, insurance_expiry, priority, needs_followup) values
    (v_company,'SécuriFeu Contrôles','Maintenance extincteurs','M. Fabre','contact@securifeu.fr','04 91 00 00 01','Marseille','France',s1,p_qhse,current_date+20,'MEDIUM',true) returning id into pr1;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country, site_id, responsible_id, insurance_expiry, priority, needs_followup) values
    (v_company,'ElecCheck Pro','Maintenance électrique','Mme Roy','contact@eleccheck.fr','04 72 00 00 02','Lyon','France',s3,p_qhse,current_date+200,'MEDIUM',false) returning id into pr2;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country, site_id, responsible_id, insurance_expiry, priority, needs_followup) values
    (v_company,'Garage Transport Services','Maintenance véhicules','M. Léon','contact@gts.fr','04 72 00 00 03','Vénissieux','France',s3,p_qhse,current_date+150,'MEDIUM',false) returning id into pr3;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country, site_id, responsible_id, insurance_expiry, priority, needs_followup) values
    (v_company,'Médecine du Travail Régionale','Médecine du travail','Dr. Meyer','contact@mtr.fr','04 78 00 00 04','Lyon','France',s2,p_qhse,current_date+300,'MEDIUM',false) returning id into pr4;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country, site_id, responsible_id, insurance_expiry, priority, needs_followup) values
    (v_company,'Formation Sécurité Plus','Organisme de formation','Mme Aziz','contact@fsp.fr','04 91 00 00 05','Marseille','France',s1,p_qhse,current_date+90,'MEDIUM',false) returning id into pr5;
  insert into public.providers (company_id, name, provider_type, contact_name, email, phone, city, country, site_id, responsible_id, insurance_expiry, priority, needs_followup) values
    (v_company,'Assurance Pro Entreprise','Assurance','M. Blanc','contact@ape.fr','01 40 00 00 06','Paris','France',null,p_qhse,current_date-10,'CRITICAL',true) returning id into pr6;

  -- Salariés (8)
  for i in 1..8 loop
    insert into public.employees (company_id, first_name, last_name, job_title, job_family, service, site_id, contract_type, hire_date, contract_end_date, email, phone, status, responsible_id, supervisor_id)
    values (
      v_company,
      (array['Marc','Julie','Karim','Sophie','Paul','Nadia','Éric','Lucas'])[i],
      (array['Durand','Petit','Benali','Moreau','Girard','Haddad','Lefevre','Roy'])[i],
      (array['Conducteur PL','Conductrice PL','Cariste','Exploitation','Conducteur SPL','Magasinier','Conducteur PL','Mécanicien'])[i],
      (array['Conducteur','Conducteur','Cariste','Exploitation','Conducteur','Cariste','Conducteur','Maintenance'])[i],
      (array['Transport','Transport','Entrepôt','Support','Transport','Entrepôt','Transport','Support'])[i],
      (array[s1,s2,s1,s2,s1,s1,s1,s3])[i],
      case when i % 4 = 0 then 'Intérim' else 'CDI' end,
      current_date - (i * 300),
      case when i % 4 = 0 then current_date + 60 end,
      'salarie' || i || '@transpilot-demo.fr',
      '06 00 00 00 0' || i,
      (array['actif','actif','actif','actif','arret_maladie','actif','actif','reprise_prevue'])[i],
      p_rh, p_qhse
    ) returning id into eid;
    emp := array_append(emp, eid);
  end loop;

  -- Véhicules (10)
  for i in 1..10 loop
    ct  := (array[-40,12,200,60,-8,90,25,300,45,5])[i];
    ins := (array[12,300,-5,80,150,20,-10,200,60,40])[i];
    insert into public.vehicles (company_id, registration_number, vehicle_type, brand, model, service_date, site_id, main_driver_id, fleet_manager_id, insurance_expiry, technical_inspection_expiry, last_maintenance, next_maintenance, mileage, tachograph_expiry, extinguisher_expiry, priority, status, responsible_id, supervisor_id)
    values (
      v_company,
      case when i = 1 then 'AB-123-CD' else 'AA-' || lpad(i::text, 3, '0') || '-BB' end,
      (array['Poids lourd','Utilitaire','Tracteur routier','Fourgon'])[1 + (i % 4)],
      (array['Renault','Volvo','MAN','Iveco','Mercedes'])[1 + (i % 5)],
      'Série ' || i,
      current_date - (i * 130),
      (array[s1,s2,s1,s3])[1 + (i % 4)],
      case when i <= 8 then emp[i] end,
      p_parc,
      current_date + ins,
      current_date + ct,
      current_date - (90 + i * 10),
      current_date + (90 - i * 5),
      60000 + i * 12500,
      case when i % 2 = 0 then current_date + (ct + 30) end,
      current_date + (ins - 15),
      (case when ct < 0 or ins < 0 then 'CRITICAL' else 'MEDIUM' end)::priority_level,
      (array['actif','actif','maintenance'])[1 + (i % 3)],
      p_parc, p_expl
    ) returning id into vid;
    veh := array_append(veh, vid);
  end loop;

  -- Équipements (6)
  for i in 1..6 loop
    nxt := (array[40,-3,120,15,200,8])[i];
    insert into public.equipments (company_id, name, equipment_type, category, serial_number, site, site_id, internal_reference, last_check_date, next_check_date, frequency, provider_id, priority, status, responsible_id, supervisor_id)
    values (
      v_company,
      (array['Hayon élévateur','Chariot élévateur','Pont roulant','Compresseur','Groupe froid','Transpalette'])[i],
      (array['Levage','Manutention','Levage','Pneumatique','Froid','Manutention'])[i],
      (array['Hayon élévateur','Chariot élévateur','Pont roulant','Compresseur','Groupe froid','Transpalette électrique'])[i],
      'SN-' || (1000 + (i - 1) * 37),
      (array['Dépôt Nord','Dépôt Sud','Atelier','Atelier','Dépôt Nord','Quai 3'])[i],
      (array[s1,s1,s3,s3,s1,s1])[i],
      'EQ-' || lpad(i::text, 4, '0'),
      current_date + (nxt - 365),
      current_date + nxt,
      'annuelle',
      (array[pr3,pr3,pr2,pr2,null,pr3]::uuid[])[i],
      (case when nxt < 0 then 'CRITICAL' when nxt <= 30 then 'HIGH' else 'MEDIUM' end)::priority_level,
      'actif', p_maint, p_qhse
    ) returning id into qid;
    eqp := array_append(eqp, qid);
  end loop;

  -- EPI (8)
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

  -- Certifications du personnel (12) — formations, habilitations, visites médicales, permis, EPI
  insert into public.employee_certifications (company_id, employee_id, type, category, title, obtained_date, expiry_date, status, priority, responsible_id, supervisor_id) values
    (v_company, emp[1], 'LICENSE',      'Permis EC',                       'Permis poids lourd EC',            current_date-1500, current_date-6,  'EXPIRED',       'CRITICAL', p_rh, p_qhse),
    (v_company, emp[1], 'FORMATION',    'FIMO',                            'FIMO marchandises',                current_date-1200, current_date+120,'COMPLIANT',     'MEDIUM',   p_rh, p_qhse),
    (v_company, emp[1], 'MEDICAL_VISIT','Visite médicale',                 'Visite médicale périodique',       current_date-320,  current_date+40, 'COMPLIANT',     'MEDIUM',   p_rh, p_qhse),
    (v_company, emp[2], 'FORMATION',    'FCO',                             'FCO marchandises',                 current_date-900,  current_date+25, 'EXPIRING_SOON', 'HIGH',     p_rh, p_qhse),
    (v_company, emp[2], 'HABILITATION', 'Habilitation électrique B0/H0',   'Habilitation électrique B0',       current_date-700,  current_date-6,  'EXPIRED',       'CRITICAL', p_rh, p_qhse),
    (v_company, emp[3], 'AUTHORIZATION','CACES R489',                      'CACES R489 catégorie 3',           current_date-800,  current_date+15, 'EXPIRING_SOON', 'HIGH',     p_rh, p_qhse),
    (v_company, emp[3], 'PPE',          'EPI',                             'Dotation EPI cariste',             current_date-200,  current_date-5,  'EXPIRED',       'CRITICAL', p_rh, p_qhse),
    (v_company, emp[3], 'FORMATION',    'SST',                             'Sauveteur secouriste du travail',  current_date-400,  current_date+200,'COMPLIANT',     'MEDIUM',   p_rh, p_qhse),
    (v_company, emp[5], 'LICENSE',      'Carte conducteur',                'Carte conducteur',                 current_date-1000, current_date+75, 'COMPLIANT',     'MEDIUM',   p_rh, p_qhse),
    (v_company, emp[6], 'AUTHORIZATION','CACES R485',                      'CACES R485 gerbeur',               current_date-600,  current_date+8,  'EXPIRING_SOON', 'HIGH',     p_rh, p_qhse),
    (v_company, emp[6], 'MEDICAL_VISIT','Visite médicale',                 'Visite médicale périodique',       current_date-350,  current_date-12, 'EXPIRED',       'CRITICAL', p_rh, p_qhse),
    (v_company, emp[8], 'HABILITATION', 'Habilitation électrique BR',      'Habilitation électrique BR',       current_date-500,  current_date+90, 'COMPLIANT',     'MEDIUM',   p_rh, p_qhse);

  -- Absences & aptitude (2) — sans diagnostic médical
  insert into public.employee_absences (company_id, employee_id, is_sick_leave, start_date, expected_end_date, return_date, work_status, aptitude, restrictions, next_medical_visit, return_visit_required, responsible_id, internal_notes) values
    (v_company, emp[5], true,  current_date-10, current_date+20, null,           'arret_maladie',  null,                    null,                                          current_date+22, true, p_rh, 'Reprise à confirmer avec la médecine du travail.'),
    (v_company, emp[8], false, current_date-30, current_date-2,  current_date-1, 'reprise_prevue', 'FIT_WITH_RESTRICTIONS', 'Pas de port de charge lourde pendant 1 mois', current_date+15, true, p_rh, 'Aménagement de poste temporaire.');

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
      case when i % 5 = 0 then null else p_qhse end,
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

  -- Obligations de site (sécurité incendie / contrôles réglementaires) rattachées via related_entity
  insert into public.obligations (company_id, title, category, description, due_date, frequency, priority, status, responsible_id, supervisor_id, provider_id, module, related_entity_type, related_entity_id, expected_document) values
    (v_company,'Contrôle extincteurs','site','Vérification annuelle des extincteurs.',current_date+8,'annuelle','HIGH','EXPIRING_SOON',p_qhse,p_admin,pr1,'SITES','SITE',s1,'Rapport de contrôle extincteurs'),
    (v_company,'Vérification installation électrique','site','Contrôle réglementaire de l''installation électrique.',current_date-8,'annuelle','CRITICAL','EXPIRED',p_maint,p_qhse,pr2,'SITES','SITE',s3,'Rapport électrique'),
    (v_company,'Contrôle des racks de stockage','site','Vérification annuelle des racks.',current_date+45,'annuelle','MEDIUM','COMPLIANT',p_expl,p_qhse,null,'SITES','SITE',s1,'Rapport contrôle racks');

  -- Documents (10) — certains expirés, quelques-uns rattachés à site/prestataire
  for i in 1..10 loop
    insert into public.documents (company_id, title, document_type, expiration_date, status, obligation_id, vehicle_id, site_id, provider_id, responsible_id, supervisor_id, uploaded_by)
    values (
      v_company,
      (array['CT_2025.pdf','Attestation_assurance.pdf','Carte_tachy.pdf','Certificat_extincteur.pdf','Visite_medicale.pdf','Permis.pdf','FIMO.pdf','Rapport_levage.pdf','PV_controle.pdf','Registre.pdf'])[i],
      (array['Contrôle','Assurance','Carte','Certificat','Médical','Permis','Formation','Rapport','PV','Registre'])[i],
      current_date + (array[-30,-5,90,180,-15,45,300,20,-2,150])[i],
      case when (array[-30,-5,90,180,-15,45,300,20,-2,150])[i] < 0 then 'EXPIRED' else 'COMPLIANT' end,
      obs[i],
      case when i % 2 = 0 then veh[1 + (i % array_length(veh, 1))] end,
      case when i = 4 then s1 end,
      case when i = 2 then pr6 when i = 8 then pr3 end,
      p_qhse, p_qhse,
      v_profile
    );
  end loop;

  -- Actions génériques (15)
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

  -- Actions d'exemple ciblées
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

  -- Contrats (6)
  insert into public.contracts (company_id, title, contract_type, provider_id, site_id, start_date, end_date, renewal_date, notice_period_days, amount, currency, responsible_id, supervisor_id, status)
  values
    (v_company,'Contrat maintenance extincteurs','Maintenance extincteurs',pr1,s1,current_date-365,current_date+45,current_date+45,30,4800,'EUR',p_qhse,p_admin,'ACTIVE'),
    (v_company,'Contrat alarme incendie','Maintenance alarme',pr1,s1,current_date-300,current_date+20,current_date+20,30,3600,'EUR',p_qhse,p_admin,'TO_RENEW'),
    (v_company,'Assurance multirisque locaux','Assurance multirisque',pr6,s2,current_date-365,current_date+90,current_date+90,60,12000,'EUR',p_qhse,p_admin,'ACTIVE'),
    (v_company,'Contrat entretien véhicules','Maintenance véhicules',pr3,s3,current_date-200,current_date+130,current_date+130,30,7800,'EUR',p_parc,p_expl,'ACTIVE'),
    (v_company,'Contrat médecine du travail','Médecine du travail',pr4,s2,current_date-365,current_date+12,current_date+12,30,2400,'EUR',p_rh,p_qhse,'TO_RENEW'),
    (v_company,'Contrat maintenance électrique','Maintenance électrique',pr2,s3,current_date-400,current_date-8,current_date-8,30,5200,'EUR',p_maint,p_qhse,'EXPIRED');

  -- Audits (4)
  insert into public.audits (company_id, title, audit_type, site_id, auditor_name, planned_date, completed_date, status, result, score, responsible_id, supervisor_id)
  values
    (v_company,'Audit sécurité semestriel','Audit sécurité',s1,'Cabinet QHSE Conseil',current_date-20,current_date-18,'DONE','MINOR_NC',82,p_qhse,p_admin),
    (v_company,'Audit client logistique','Audit client',s1,'Cabinet QHSE Conseil',current_date+5,null,'IN_PROGRESS',null,null,p_qhse,p_admin),
    (v_company,'Inspection interne entrepôt','Audit interne',s1,'Cabinet QHSE Conseil',current_date+30,null,'PLANNED',null,null,p_qhse,p_admin),
    (v_company,'Visite sécurité atelier','Visite sécurité',s3,'Cabinet QHSE Conseil',current_date-5,null,'LATE',null,null,p_maint,p_qhse);

  -- Non-conformités (5)
  insert into public.non_conformities (company_id, title, description, severity, source_type, site_id, related_entity_type, related_entity_id, detected_at, due_date, responsible_id, supervisor_id, status)
  values
    (v_company,'Registre sécurité non mis à jour','Écart constaté à traiter.','MEDIUM','Audit',s1,'SITE',s1,current_date-10,current_date+20,p_qhse,p_admin,'OPEN'),
    (v_company,'Contrôle gaz expiré','Écart constaté à traiter.','HIGH','Contrôle',s3,'SITE',s3,current_date-25,current_date+5,p_maint,p_qhse,'IN_PROGRESS'),
    (v_company,'Rapport extincteurs manquant','Écart constaté à traiter.','MEDIUM','Document',s1,'SITE',s1,current_date-6,current_date+15,p_qhse,p_admin,'OPEN'),
    (v_company,'Pneus véhicule AB-123-CD à contrôler','Écart constaté à traiter.','HIGH','Véhicule',null,'VEHICLE',veh[1],current_date-3,current_date+7,p_parc,p_expl,'OPEN'),
    (v_company,'Action corrective audit client non terminée','Écart constaté à traiter.','CRITICAL','Audit',s1,'SITE',s1,current_date-30,current_date-2,p_qhse,p_admin,'IN_PROGRESS');

  -- Incidents & observations sécurité (3)
  insert into public.incidents (company_id, type, title, description, site_id, zone, occurred_at, severity, status, responsible_id, supervisor_id, related_entity_type, related_entity_id)
  values
    (v_company,'NEAR_MISS','Presque-accident chariot élévateur sur zone de circulation','Événement terrain à traiter.',s1,'Zone caristes',current_date-4,'HIGH','OPEN',p_qhse,p_expl,'SITE',s1),
    (v_company,'OBSERVATION','Port des EPI non respecté au quai','Événement terrain à traiter.',s1,'Quai 3',current_date-9,'MEDIUM','IN_PROGRESS',p_qhse,p_expl,'SITE',s1),
    (v_company,'INCIDENT','Choc palette contre rack de stockage','Événement terrain à traiter.',s3,'Stockage A',current_date-2,'MEDIUM','OPEN',p_qhse,p_expl,'SITE',s3);

  return 'Données de démonstration chargées : 8 membres, 3 sites, 6 prestataires, 6 contrats, 4 audits, 5 non-conformités, 3 incidents, 10 véhicules, 8 salariés, 12 habilitations, 2 absences, 6 équipements, 8 EPI, 23 obligations, 10 documents, 20 actions, 6 notifications.';
end;
$$;
