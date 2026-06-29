# NeoTravel — Automatisation des processus commerciaux

NeoTravel est une application Next.js qui qualifie des demandes de transport de groupe, calcule un devis, genere un PDF et peut l'envoyer au prospect par email via Resend. Les donnees metier sont stockees dans Supabase.

Le projet utilise Next.js App Router, TypeScript, Supabase, Vercel AI SDK, Anthropic, pdf-lib, Resend, Zod et Jest.

## Etat actuel

```
Prospect (chat) → Agent IA (Vercel AI SDK) → calculer_devis() → PDF (pdf-lib) → Email (Resend)
                                           → Supabase (stockage CRM)
                                           → Edge Functions Supabase (relances cron J+2/J+3/J+7)
```

- calcul deterministe du devis dans `lib/calculer-devis.ts` ;
- tests Jest du calcul dans `__tests__/calculer-devis.test.ts` ;
- migration Supabase complete dans `neotravel_migration.sql` ;
- route agent dans `app/api/agent/route.ts` ;
- tools agent : `calculer_devis`, `enregistrer_lead`, `mettre_a_jour_statut`, `escalader_humain`, `envoyer_email` ;
- generation du PDF dans `lib/devis-pdf.ts` ;
- envoi email avec PDF en piece jointe dans `lib/email-devis.ts`.

Encore a finaliser selon le planning :

```
neotravel/
├── app/
│   ├── api/chat/           # Route POST de l'agent IA (streaming texte + tools)
│   ├── api/agent/          # Route alternative UIMessage (non utilisée en prod)
│   ├── dashboard/          # Dashboard direction (KPIs Supabase temps réel)
│   └── page.tsx            # Landing conversationnelle (chat prospect)
├── lib/
│   ├── agent/
│   │   ├── prompt.ts       # Prompt système de l'agent
│   │   └── tools.ts        # 5 tools : calculer_devis, enregistrer_lead,
│   │                       #           envoyer_devis_par_email, mettre_a_jour_statut,
│   │                       #           escalader_humain
│   ├── calculer-devis.ts   # Fonction de pricing déterministe (ne pas modifier sans tests)
│   ├── dashboard-data.ts   # Requêtes Supabase pour le dashboard
│   ├── devis-pdf.ts        # Génération du PDF avec pdf-lib
│   ├── email-devis.ts      # Envoi email avec Resend (PDF en pièce jointe)
│   └── supabase.ts         # Clients Supabase (public + admin)
├── types/
│   └── index.ts            # Types TypeScript partagés (Demande, DevisDB, Log…)
├── docs/
│   ├── procedure-equipes.html  # Guide utilisateur équipes commerciales
│   └── procedure-equipes.md
├── supabase/
│   └── functions/
│       └── relancer-prospect/  # Edge Function cron (relances J+2 / J+5 / J+7)
│           ├── index.ts
│           └── cron-setup.sql  # Script pg_cron à exécuter dans Supabase SQL Editor
├── neotravel_migration.sql # Schéma BDD complet — à exécuter dans Supabase SQL Editor
└── __tests__/
    └── calculer-devis.test.ts  # 12 tests Jest sur la fonction de pricing
```

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

## Guide du repreneur

Cette section explique comment modifier les éléments clés du projet sans tout casser.

### Modifier le pricing

Tout le calcul de prix est dans `lib/calculer-devis.ts`. Les constantes sont en haut du fichier :

```ts
const PRIX_PAR_KM = 2.5        // € par km
const PRIX_MINIMUM = 350        // € plancher par trajet
const DISTANCE_MAX_KM = 1500   // au-delà = hors zone, escalade humaine
const TVA = 0.10                // 10 %
const MARGE = 0.15              // marge commerciale 15 %
const PRIX_GUIDE_JOUR = 80      // € par jour de guide
const PRIX_NUIT_CHAUFFEUR = 120 // € par nuit chauffeur
const CAPACITE_MAX = 85         // au-delà = escalade humaine
```

Les coefficients sont dans trois fonctions exportées (`coefSaison`, `coefUrgence`, `coefCapacite`). Modifier leurs valeurs change directement les prix calculés.

**Après toute modification du pricing, relancer les tests :**
```bash
npm test
```
Les 12 tests vérifient les cas nominaux et les cas limites. S'ils passent, le pricing est cohérent.

---

### Modifier le comportement de l'agent IA

Le prompt système est dans `lib/agent/prompt.ts`. C'est un fichier texte — modifier les instructions change directement ce que l'agent dit et fait.

Points clés à ne pas supprimer :
- La règle "ne jamais calculer un prix soi-même" — le LLM doit toujours passer par `calculer_devis()`
- La règle "ne jamais estimer la distance" — l'agent doit la demander explicitement
- Les conditions d'escalade (> 80 passagers, trajet international)

---

### Ajouter un tool à l'agent

Les tools sont dans `lib/agent/tools.ts`. Chaque tool suit cette structure :

```ts
nom_du_tool: tool({
  description: 'Ce que fait ce tool (vu par le LLM pour décider quand l\'appeler)',
  inputSchema: z.object({
    // paramètres typés avec Zod
  }),
  execute: async (params) => {
    // logique serveur — peut appeler Supabase, Resend, etc.
    return { ... } // résultat renvoyé au LLM
  },
}),
```

---

### Ajouter un statut de demande

Les statuts sont définis à trois endroits — les trois doivent être mis à jour ensemble :

1. **`types/index.ts`** — type `StatutDemande`
2. **`neotravel_migration.sql`** — enum `statut_demande` (et dans Supabase via `ALTER TYPE statut_demande ADD VALUE 'nouveau_statut'`)
3. **`lib/agent/tools.ts`** — schéma Zod dans `mettre_a_jour_statut`

---

### Modifier le template email

Le contenu HTML de l'email est dans `lib/email-devis.ts`, fonction `envoyerEmailDevis`. Le corps du message est dans la propriété `html` de l'appel `resend.emails.send(...)`.

---

### Modifier le PDF généré

La mise en page du PDF est dans `lib/devis-pdf.ts`, fonction `genererDevisPdf`. Le PDF est construit ligne par ligne avec `pdf-lib` — chaque `draw(...)` ajoute un texte, chaque `move(...)` descend le curseur vertical.

---

### Déploiement Vercel

Le projet est déployé manuellement sur Vercel (repo GitHub non connecté). Pour redéployer :

```bash
npx vercel --prod
```

Les variables d'environnement sont à renseigner dans Vercel > Settings > Environment Variables (les mêmes que `.env.local`).

## Edge Functions — Relances automatiques

La fonction `supabase/functions/relancer-prospect/` gère les relances prospects en 3 étapes :

| Étape | Déclencheur | Action |
|-------|-------------|--------|
| Relance 1 | J+2 après `devis_envoye` | Email de suivi + statut → `relance_1` |
| Relance 2 | J+3 après `relance_1` (= J+5) | Email de dernière relance + statut → `relance_2` |
| Clôture | J+2 après `relance_2` (= J+7) | Statut → `cloture`, aucun email |

### Déploiement de la Edge Function

```bash
npx supabase functions deploy relancer-prospect --project-ref bfqkuwbtqqyisjzrjqep
```

Ajouter les variables d'environnement dans **Supabase > Edge Functions > relancer-prospect > Secrets** :
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` *(optionnel — défaut : `onboarding@resend.dev`)*

### Activation du cron quotidien

1. Dans Supabase > **Database > Extensions**, activer `pg_cron` et `pg_net`
2. Dans **SQL Editor**, remplacer `<PROJECT_REF>` dans `supabase/functions/relancer-prospect/cron-setup.sql` et exécuter le script
3. Le cron se déclenche chaque jour à **08h00 UTC**

## Ressources

- **Figma** : [NeoTravel — Maquette Site Web](https://www.figma.com/design/gpKMpdgnx2Vkh3eeqypJAN/NEOTRAVEL-%E2%80%94-Maquette-Site-Web--copie-?node-id=0-1&p=f&t=1MI9omxJKytwja2W-0)

## Équipe

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
