// Historique global : écriture best-effort dans audit_logs (table existante).
// Non bloquant : une erreur de log ne doit jamais faire échouer l'action métier.

type MiniClient = {
  from: (table: string) => { insert: (values: Record<string, unknown>) => PromiseLike<unknown> };
};

export interface ActivityEntry {
  actionType: string; // ARCHIVE / RESTORE / REMINDER / CORRECTIVE_LINK / UPDATE …
  entityType: string; // nom de table (vehicles, non_conformities, reminders…)
  entityId?: string | null;
  label?: string | null;
  comment?: string | null;
}

export async function logActivity(
  supabase: MiniClient,
  companyId: string,
  userId: string | null,
  entry: ActivityEntry
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      company_id: companyId,
      user_id: userId,
      action_type: entry.actionType,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      new_value: { label: entry.label ?? null, comment: entry.comment ?? null },
    });
  } catch {
    // best-effort : on ignore les erreurs de journalisation
  }
}
