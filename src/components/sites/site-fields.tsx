import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SITE_TYPES } from "@/types/enums";
import type { Profile, Site } from "@/lib/types/database";

/** Champs partagés du formulaire site (création et modification). */
export function SiteFields({ profiles, site }: { profiles: Profile[]; site?: Site }) {
  const profileLabel = (p: Profile) =>
    [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email;
  return (
    <>
      <div className="sm:col-span-2">
        <Label>Nom</Label>
        <Input name="name" required defaultValue={site?.name ?? ""} />
      </div>
      <div>
        <Label>Type de site</Label>
        <Select name="site_type" defaultValue={site?.site_type ?? SITE_TYPES[0]}>
          {SITE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Type d&apos;activité</Label>
        <Input name="activity_type" defaultValue={site?.activity_type ?? ""} />
      </div>
      <div>
        <Label>Adresse</Label>
        <Input name="address" defaultValue={site?.address ?? ""} />
      </div>
      <div>
        <Label>Ville</Label>
        <Input name="city" defaultValue={site?.city ?? ""} />
      </div>
      <div>
        <Label>Code postal</Label>
        <Input name="postal_code" defaultValue={site?.postal_code ?? ""} />
      </div>
      <div>
        <Label>Pays</Label>
        <Input name="country" defaultValue={site?.country ?? "France"} />
      </div>
      <div>
        <Label>Surface (m²)</Label>
        <Input name="surface_area" type="number" defaultValue={site?.surface_area ?? ""} />
      </div>
      <div>
        <Label>Responsable du site</Label>
        <Select name="manager_id" defaultValue={site?.manager_id ?? ""}>
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{profileLabel(p)}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Superviseur</Label>
        <Select name="supervisor_id" defaultValue={site?.supervisor_id ?? ""}>
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{profileLabel(p)}</option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea name="notes" defaultValue={site?.notes ?? ""} />
      </div>
    </>
  );
}
