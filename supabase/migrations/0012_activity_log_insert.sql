-- =====================================================================
-- Historique global : autoriser l'app à écrire dans audit_logs (les
-- membres du tenant). La lecture est déjà autorisée (audit_select).
-- Réutilise la table existante — pas de table doublon.
-- =====================================================================

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'audit_logs' and policyname = 'audit_insert') then
    create policy audit_insert on public.audit_logs
      for insert with check (company_id = public.auth_company_id());
  end if;
end $$;
