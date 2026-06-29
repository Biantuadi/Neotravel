# NeoTravel

NeoTravel est une application Next.js qui qualifie des demandes de transport de groupe, calcule un devis, genere un PDF et peut l'envoyer au prospect par email via Resend. Les donnees metier sont stockees dans Supabase.

Le projet utilise Next.js App Router, TypeScript, Supabase, Vercel AI SDK, Anthropic, pdf-lib, Resend, Zod et Jest.

## Etat actuel

Fonctionnel dans le code :

- calcul deterministe du devis dans `lib/calculer-devis.ts` ;
- tests Jest du calcul dans `__tests__/calculer-devis.test.ts` ;
- migration Supabase complete dans `neotravel_migration.sql` ;
- route agent dans `app/api/agent/route.ts` ;
- tools agent : `calculer_devis`, `enregistrer_lead`, `mettre_a_jour_statut`, `escalader_humain`, `envoyer_email` ;
- generation du PDF dans `lib/devis-pdf.ts` ;
- envoi email avec PDF en piece jointe dans `lib/email-devis.ts`.

Encore a finaliser selon le planning :

- interface prospect conversationnelle : `app/page.tsx` est encore la page de demarrage Next.js ;
- dashboard direction ;
- relances automatiques Supabase Edge Functions ;
- verification de bout en bout avec les vraies variables d'environnement.

## Installation

Installer les dependances :

```bash
npm install
```

Lancer le serveur de developpement :

```bash
npm run dev
```

Ouvrir ensuite :

```text
http://localhost:3000
```

## Scripts disponibles

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

`npm test` lance Jest sur les tests du calcul de devis.

## Variables d'environnement

Creer un fichier `.env.local` a la racine du projet :

```bash
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL="NeoTravel <onboarding@resend.dev>"
```

Notes :

- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` alimentent le client public Supabase dans `lib/supabase.ts` ;
- `SUPABASE_SERVICE_ROLE_KEY` est utilisee cote serveur par `supabaseAdmin` ;
- `ANTHROPIC_API_KEY` sert au modele Anthropic appele par le Vercel AI SDK ;
- `RESEND_API_KEY` est obligatoire pour envoyer un devis par email ;
- `RESEND_FROM_EMAIL` peut etre remplace par une adresse verifiee dans Resend.

Ne jamais commit le fichier `.env.local`.

## Base de donnees Supabase

Le schema est dans `neotravel_migration.sql`.

Tables creees :

- `clients`
- `demandes`
- `matrices`
- `devis`
- `relances`
- `logs`

Pour initialiser Supabase :

1. ouvrir le SQL Editor Supabase ;
2. copier le contenu de `neotravel_migration.sql` ;
3. executer la migration ;
4. renseigner les variables Supabase dans `.env.local`.

Les politiques RLS sont activees et le backend utilise la cle `service_role` pour ecrire dans les tables.

## Agent IA

La route principale est :

```text
POST /api/agent
```

Fichier :

```text
app/api/agent/route.ts
```

Le prompt systeme est la constante `SYSTEM_PROMPT`.

Le modele configure actuellement est :

```ts
anthropic('claude-sonnet-4-6')
```

Le runtime est force en Node.js avec :

```ts
export const runtime = 'nodejs'
```

C'est necessaire pour l'envoi email et la generation PDF cote serveur.

## Tools de l'agent

### `calculer_devis`

Appelle `calculerDevis()` depuis `lib/calculer-devis.ts`.

Parametres principaux :

- `nbPassagers`
- `distanceKm`
- `dateDemande`
- `dateDepart`
- `typeVehicule`
- `options.guideJours`
- `options.nuitsChauffeur`
- `options.peages`

Retourne :

- `prixHT`
- `tva`
- `prixTTC`
- `lignes`
- `coefficients`
- `devise`

### `enregistrer_lead`

Insere une demande dans `demandes` avec le statut `nouveau_lead` et calcule un score de completude.

### `mettre_a_jour_statut`

Met a jour le statut d'une demande.

Statuts possibles :

- `nouveau_lead`
- `incomplet`
- `qualifie`
- `devis_envoye`
- `relance_1`
- `relance_2`
- `accepte`
- `refuse`
- `cas_complexe`
- `cloture`

### `escalader_humain`

Passe une demande en `cas_complexe` et ajoute un log.

### `envoyer_email`

Genere le PDF, envoie l'email via Resend, insere une ligne dans `devis`, passe la demande en `devis_envoye` et ajoute un log.

## Generation du devis PDF

Fichier :

```text
lib/devis-pdf.ts
```

La fonction principale est :

```ts
genererDevisPdf()
```

Le PDF affiche :

- la reference du devis ;
- la date de generation ;
- les coordonnees prospect ;
- le trajet ;
- le detail des lignes ;
- le montant HT ;
- la TVA ;
- le montant TTC ;
- les coefficients saison, urgence et capacite.

## Envoi email

Fichier :

```text
lib/email-devis.ts
```

La fonction principale est :

```ts
envoyerEmailDevis()
```

Elle :

- verifie la presence de `RESEND_API_KEY` ;
- genere le PDF avec `genererDevisPdf()` ;
- envoie l'email au prospect ;
- attache le PDF au message.

## Modifier le pricing

La logique tarifaire est dans :

```text
lib/calculer-devis.ts
```

Constantes principales :

- `PRIX_PAR_KM`
- `PRIX_MINIMUM`
- `DISTANCE_MAX_KM`
- `TVA`
- `MARGE`
- `PRIX_GUIDE_JOUR`
- `PRIX_NUIT_CHAUFFEUR`
- `CAPACITE_MAX`

Fonctions de coefficients :

- `coefSaison(mois)`
- `coefUrgence(jours)`
- `coefCapacite(nb)`

Apres modification du pricing, lancer :

```bash
npm test
```

Puis ajuster les valeurs attendues dans `__tests__/calculer-devis.test.ts` si la regle metier a volontairement change.

## Ajouter un statut

Modifier les fichiers suivants :

- `neotravel_migration.sql`, enum `statut_demande` ;
- `types/index.ts`, type `StatutDemande` ;
- `app/api/agent/route.ts`, schema `mettreAJourStatutParams`.

Si le statut doit etre visible dans un futur dashboard, l'ajouter aussi dans la page dashboard correspondante.

## Changer le prompt de l'agent

Modifier la constante `SYSTEM_PROMPT` dans :

```text
app/api/agent/route.ts
```

Apres modification, tester au minimum :

- demande incomplete ;
- demande simple complete ;
- demande urgente ;
- cas complexe ;
- envoi de devis.

## Tests

Les tests actuels couvrent surtout `calculerDevis()`.

Commande :

```bash
npm test
```

Cas couverts :

- cas simple ;
- demande urgente ;
- options guide, nuit chauffeur et peages ;
- gros volume ;
- 0 passager ;
- capacite depassee ;
- hors zone ;
- dates incoherentes ;
- distance invalide ;
- bornes des coefficients.

## Points d'attention

- Le code contient actuellement plusieurs textes avec des problemes d'encodage dans certains fichiers sources. Cela n'empeche pas forcement l'execution, mais il faudra nettoyer l'encodage avant une remise propre.
- `app/page.tsx` n'est pas encore l'interface conversationnelle finale.
- Le PDF est genere cote serveur et utilise les polices standard de `pdf-lib`.
- Les fichiers PDF ne sont pas encore stockes dans Supabase Storage : ils sont attaches directement a l'email.
- `pdf_url` existe dans la table `devis`, mais n'est pas encore renseigne.
- Les relances automatiques ne sont pas encore implementees dans ce depot.

## Structure rapide

```text
app/
  api/agent/route.ts     Route API de l'agent IA
  page.tsx               Page frontend actuelle
lib/
  calculer-devis.ts      Calcul tarifaire pur
  devis-pdf.ts           Generation du PDF
  email-devis.ts         Envoi email Resend
  supabase.ts            Clients Supabase
types/
  index.ts               Types metier partages
__tests__/
  calculer-devis.test.ts Tests Jest du pricing
neotravel_migration.sql  Schema Supabase
```
