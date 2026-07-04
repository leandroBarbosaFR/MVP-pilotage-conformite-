# Pilotage Conformité — MVP

Outil SaaS B2B de pilotage des obligations, échéances, documents et actions de conformité
pour les entreprises de **transport, logistique et flotte de véhicules**.

Stack : **Next.js (App Router) · TypeScript · Supabase (Auth / PostgreSQL / Storage) · Tailwind CSS**.

Design volontairement sobre : blanc / noir / gris / bleu foncé, bordures visibles, aucune ombre,
aucun gradient, aucun emoji.

---

## 1. Fonctionnalités

- Landing page publique + formulaire « entreprise pilote ».
- Authentification Supabase (rôles `ADMIN_COMPANY`, `SUPERVISOR`, `RESPONSIBLE`, `VIEWER`).
- Multi-entreprises isolées par **Row Level Security** (`company_id`).
- Tableau de bord global (score, obligations à jour / bientôt expirées / expirées,
  documents manquants et expirés, actions en retard, notifications).
- Modules : Obligations, Actions, Véhicules, Conducteurs, Équipements, Documents,
  Imports, Notifications, Paramètres.
- Pages de détail avec éléments liés (documents, obligations, actions).
- Upload PDF / image + **scan mobile** (appareil photo via `capture="environment"`).
- Import **Excel / CSV** avec prévisualisation, mapping des colonnes et historique.
- **Archivage** (aucune suppression définitive : `is_archived` / `archived_at` / `archived_by`).
- Journal d'audit (`audit_logs`) sur obligations, actions et documents.
- Responsive mobile.

## 2. Prérequis

- Node.js 20+
- Un projet [Supabase](https://supabase.com)

## 3. Configuration Supabase

1. Créez un projet Supabase.
2. Dans **SQL Editor**, exécutez dans l'ordre :
   - `supabase/migrations/0001_init.sql` (schéma, RLS, triggers, storage, RPC)
   - `supabase/seed.sql` (déclare la fonction `load_demo_data()`)
3. Le bucket privé `documents` est créé par la migration. Vérifiez dans **Storage**.
4. (Optionnel) Pour tester sans confirmation d'email : **Authentication → Providers → Email**,
   désactivez « Confirm email ». Sinon, confirmez l'email après inscription.

## 4. Variables d'environnement

Copiez `.env.example` en `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...            # facultatif (usage serveur)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=documents
```

## 5. Lancer en local

```bash
npm install
npm run dev
```

Ouvrez http://localhost:3000.

1. Créez un compte via **Créer un compte** → une entreprise et un profil `ADMIN_COMPANY`
   sont créés automatiquement (trigger `handle_new_user`).
2. Une fois connecté, allez dans **Paramètres → Charger les données de démonstration**
   pour peupler l'entreprise (TransPilot Demo : 10 véhicules, 8 conducteurs, 6 équipements,
   20 obligations, 10 documents, 15 actions, notifications).

## 6. Architecture

```
src/
  app/
    page.tsx                 Landing publique
    (auth)/login, /signup    Authentification
    dashboard/               Espace protégé (middleware)
      layout.tsx             Sidebar + topbar
      page.tsx               Tableau de bord (Promise.all groupé)
      obligations|actions|vehicles|employees|equipments|
      documents|imports|notifications|settings/
        page.tsx             Listes (recherche, filtres, pagination)
        [id]/page.tsx        Détail
  components/
    ui/                      Primitives sobres (button, card, input, table, status-badge)
    app/                     Shell (sidebar, page-header, stat-card, pagination, add-panel…)
    marketing|auth|documents|imports|notifications|settings/
  lib/
    supabase/                Clients server / client / middleware (@supabase/ssr)
    queries/                 Lectures (getDashboardStats, getVehicles, …) — cache() par requête
    actions/                 Server Actions (create*, toggleArchive, runImport, auth…)
    types/database.ts        Types du schéma
    status.ts, utils.ts      Statuts de conformité, formatage
  middleware.ts              Rafraîchit la session + protège /dashboard
supabase/
  migrations/0001_init.sql   Schéma + RLS + triggers + RPC + storage
  seed.sql                   Fonction load_demo_data()
```

## 7. Gestion des requêtes et cache

- Lectures dans des **Server Components** via `src/lib/queries/*`.
- `getCurrentContext` utilise `cache()` (React) pour éviter les appels répétés dans un rendu.
- Statistiques du tableau de bord regroupées côté serveur (RPC `get_dashboard_stats`) + `Promise.all`.
- Écritures via **Server Actions** qui appellent `revalidatePath` sur les pages concernées.
- Listes paginées et filtrées **côté serveur** (`range`, `ilike`, filtres `eq`).

## 8. Sécurité (RLS)

- Chaque utilisateur ne voit que les données de sa `company_id` (`auth_company_id()`).
- Écritures interdites aux `VIEWER` (`auth_can_write()`), suppression réservée à `ADMIN_COMPANY`.
- Storage : accès aux fichiers limité au dossier `${company_id}/…`.

## 9. Hors périmètre du MVP

Pas d'intégrations TMS/RH/GMAO, pas d'IA, pas d'analyse réglementaire automatique,
pas de paiement, pas de multi-langue, pas d'app mobile native, pas de reporting complexe.
