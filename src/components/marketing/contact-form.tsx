"use client";

import { useActionState } from "react";
import { submitPilotLead, type LeadResult } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<LeadResult | null, FormData>(
    submitPilotLead,
    null
  );

  if (state?.ok) {
    return (
      <div className="border border-status-ok bg-background p-6">
        <p className="text-sm font-medium text-status-ok">Demande envoyée</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Merci. Nous revenons vers vous rapidement pour organiser un diagnostic.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email professionnel</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="company">Entreprise</Label>
        <Input id="company" name="company" />
      </div>
      <div>
        <Label htmlFor="sector">Secteur</Label>
        <Select id="sector" name="sector" defaultValue="">
          <option value="">Sélectionner</option>
          <option>Transport</option>
          <option>Logistique</option>
          <option>Gestion de flotte</option>
          <option>Autre</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="employee_count">Nombre de salariés</Label>
        <Select id="employee_count" name="employee_count" defaultValue="">
          <option value="">Sélectionner</option>
          <option>1 à 10</option>
          <option>10 à 50</option>
          <option>50 à 100</option>
          <option>100 à 250</option>
          <option>250+</option>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" />
      </div>
      {state?.error ? (
        <p className="text-sm text-status-danger sm:col-span-2">{state.error}</p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer"}
        </Button>
      </div>
    </form>
  );
}
