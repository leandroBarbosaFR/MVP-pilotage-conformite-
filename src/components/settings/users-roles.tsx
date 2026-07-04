"use client";

import { useTransition } from "react";
import { updateUserRole, setUserActive } from "@/lib/actions/admin";
import { UserRole, USER_ROLE_LABELS } from "@/types/enums";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";

export interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  linked: boolean; // rattaché à un compte de connexion
}

export function UsersRoles({ members, editable }: { members: MemberRow[]; editable: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Table>
      <THead>
        <TR>
          <TH>Nom</TH>
          <TH>Email</TH>
          <TH>Rôle</TH>
          <TH>Statut</TH>
          {editable ? <TH>Actions</TH> : null}
        </TR>
      </THead>
      <tbody>
        {members.length === 0 ? (
          <EmptyRow colSpan={editable ? 5 : 4} message="Aucun membre." />
        ) : (
          members.map((m) => (
            <TR key={m.id}>
              <TD className="font-medium">{m.name}</TD>
              <TD>{m.email}</TD>
              <TD>
                {editable ? (
                  <Select
                    defaultValue={m.role}
                    disabled={pending}
                    className="h-8 w-52"
                    onChange={(e) =>
                      startTransition(() => updateUserRole(m.id, e.target.value))
                    }
                  >
                    {Object.values(UserRole).map((r) => (
                      <option key={r} value={r}>
                        {USER_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                ) : (
                  USER_ROLE_LABELS[m.role as UserRole] ?? m.role
                )}
              </TD>
              <TD>
                <span
                  className={
                    m.is_active
                      ? "inline-flex items-center gap-1.5 text-sm text-status-ok"
                      : "inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                  }
                >
                  <span
                    className={`h-2 w-2 rounded-full ${m.is_active ? "bg-status-ok" : "bg-status-none"}`}
                  />
                  {m.is_active ? "Actif" : "Inactif"}
                </span>
              </TD>
              {editable ? (
                <TD>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => startTransition(() => setUserActive(m.id, !m.is_active))}
                  >
                    {m.is_active ? "Désactiver" : "Activer"}
                  </Button>
                </TD>
              ) : null}
            </TR>
          ))
        )}
      </tbody>
    </Table>
  );
}
