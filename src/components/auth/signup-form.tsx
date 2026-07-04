"use client";

import { useActionState } from "react";
import { signUp, type AuthResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(signUp, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="first_name">Prénom</Label>
          <Input id="first_name" name="first_name" required />
        </div>
        <div>
          <Label htmlFor="last_name">Nom</Label>
          <Input id="last_name" name="last_name" required />
        </div>
      </div>
      <div>
        <Label htmlFor="company_name">Entreprise</Label>
        <Input id="company_name" name="company_name" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="sector">Secteur</Label>
          <Select id="sector" name="sector" defaultValue="Transport / Logistique">
            <option>Transport</option>
            <option>Logistique</option>
            <option>Transport / Logistique</option>
            <option>Gestion de flotte</option>
            <option>Autre</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="employee_count">Salariés</Label>
          <Select id="employee_count" name="employee_count" defaultValue="10 à 50">
            <option>1 à 10</option>
            <option>10 à 50</option>
            <option>50 à 100</option>
            <option>100 à 250</option>
            <option>250+</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email professionnel</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
      </div>
      {state?.error ? <p className="text-sm text-status-danger">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le compte"}
      </Button>
    </form>
  );
}
