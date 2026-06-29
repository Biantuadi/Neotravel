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
AI_GATEWAY_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL="NeoTravel <onboarding@resend.dev>"
```

Notes :

- `AI_GATEWAY_API_KEY` — clé de la passerelle Vercel AI Gateway (route vers `anthropic/claude-sonnet-4-5`) ;
- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` alimentent le client public Supabase dans `lib/supabase.ts` ;
- `SUPABASE_SERVICE_ROLE_KEY` est utilisee cote serveur par `supabaseAdmin` (bypasse le RLS pour les écritures agent) ;
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
POST /api/chat
```

Fichier :

```text
app/api/chat/route.ts
```

Le prompt systeme est la constante `SYSTEM_PROMPT` dans `lib/agent/prompt.ts`.

Le modele configure actuellement est :

```ts
gateway('anthropic/claude-sonnet-4-5')
```

Le runtime est force en Node.js avec :

```ts
export const runtime = 'nodejs'
```

C'est necessaire pour l'envoi email et la generation PDF cote serveur.

## Fiabilité, garde-fous et RGPD

### Calcul déterministe — le LLM ne touche jamais aux prix

Le LLM **ne calcule jamais un prix lui-même**. La règle est inscrite dans le prompt système (`lib/agent/prompt.ts`) : *"Tu ne calcules JAMAIS un prix toi-même. Uniquement calculer_devis()."* Toute la logique tarifaire est dans `lib/calculer-devis.ts` (fonction pure, testée par 13 tests Jest). Le LLM appelle le tool avec des paramètres structurés, reçoit le résultat et l'affiche — il ne peut pas négocier, inventer ou arrondir un montant.

### Prompt injection — neutralisée par architecture

L'agent ne peut pas être manipulé pour sortir un prix arbitraire car :
- le calcul est **hors du contexte LLM** (code TypeScript côté serveur) ;
- tous les paramètres des tools sont **validés par des schémas Zod** (`inputSchema`) avant exécution — une valeur invalide rejette l'appel ;
- `stopWhen: isStepCount(10)` limite le nombre d'étapes pour éviter les boucles d'exploitation.

### HITL — Human-in-the-Loop

Deux situations déclenchent un transfert automatique à un commercial humain (tool `escalader_humain`) :
1. **Plus de 80 passagers** — dépasse le barème automatique (`CAPACITE_MAX = 85` dans `calculer-devis.ts`) ;
2. **Trajet hors zone** (> 1 500 km) — `DISTANCE_MAX_KM` dans le même fichier ;
3. **Toute demande jugée complexe** par le LLM selon les instructions du prompt.

Le dossier passe en statut `cas_complexe` dans Supabase avec un log horodaté. Le commercial voit l'alerte dans le dashboard.

### Sorties structurées — Zod sur tous les tools

Chaque tool de l'agent (`lib/agent/tools.ts`) déclare un `inputSchema` Zod complet. Le Vercel AI SDK valide les paramètres avant d'appeler `execute`. Aucun tool ne reçoit de données non-typées.

### RGPD — minimisation et sécurité des données

| Principe | Implémentation |
|----------|---------------|
| **Minimisation** | Seuls les champs nécessaires au devis sont collectés (nom, email optionnel, téléphone optionnel, trajet, date, passagers) |
| **Pseudonymisation** | Les leads sans email sont stockés sans identifiant personnel obligatoire |
| **Contrôle d'accès** | RLS (Row Level Security) activé sur toutes les tables Supabase — les lectures publiques sont interdites |
| **Clé service** | `supabaseAdmin` (clé `service_role`) utilisée uniquement côté serveur dans les Server Actions et API routes — jamais exposée au client |
| **Pas de stockage LLM** | Les conversations ne sont pas persistées dans la base — seules les données métier issues des tools sont sauvegardées |
| **Emails** | Envoyés via Resend depuis un domaine vérifié — aucune adresse email n'est partagée avec des tiers |

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

## Backlog — Prochaines évolutions

> **État à la soutenance (29 juin 2026).** Le flux complet est opérationnel : prospect → CRM → devis → email → dashboard. Les points ci-dessous sont ce qui reste à faire ou ce qui serait fait si le projet continuait.

### P1 — Corrections immédiates

| # | Sujet | État | Description |
|---|-------|------|-------------|
| P1-1 | Fix table `clients` | ✅ Résolu | L'override `enregistrer_lead` dans `/api/chat/route.ts` utilisait `onStepFinish` pour capturer le `demande_id` sans dupliquer la logique — `tools.ts` gère désormais l'upsert client complet. |
| P1-2 | Déploiement Edge Function relances | 🟡 En cours | La fonction `supabase/functions/relancer-prospect/` est écrite et testée. Il reste à l'activer sur le projet Supabase (commande : `npx supabase functions deploy relancer-prospect --project-ref bfqkuwbtqqyisjzrjqep`) et à activer `pg_cron` + `pg_net` dans les extensions. |
| P1-3 | Authentification dashboard | 🔴 À faire | Le dashboard `/dashboard` est accessible sans login. Protéger avec Supabase Auth (middleware Next.js `matcher: ['/dashboard/:path*']`) ou un simple mot de passe Vercel. |
| P1-4 | Test bout-en-bout documenté | 🟡 À faire | Valider le parcours complet une fois en conditions réelles depuis le déploiement Vercel : chat → lead → devis → email → relance → dashboard. Consigner le résultat. |

### P2 — Améliorations prioritaires (prochaine itération)

| # | Sujet | Description |
|---|-------|-------------|
| P2-1 | Acceptation devis en ligne | Ajouter un lien "J'accepte ce devis" dans l'email → page de confirmation → statut `accepte` automatique sans intervention humaine. |
| P2-2 | Calcul distance automatique | Intégrer Google Maps Distance Matrix ou OpenRouteService pour calculer `distanceKm` depuis les villes de départ/arrivée — supprimer la question au prospect. |
| P2-3 | Notification commerciaux | Envoyer un email interne à l'équipe quand une demande passe en `cas_complexe` ou `accepte` (actuellement invisible sans consulter le dashboard). |
| P2-4 | Relances SMS / WhatsApp | Le canal est prévu dans le schéma (`canal_relance enum`). Brancher Twilio ou l'API WhatsApp Business pour toucher les prospects qui ne lisent pas leurs emails. |
| P2-5 | Fiche client complète | Afficher l'historique de toutes les demandes d'un client dans la page `/dashboard/clients/[id]`. |

### P3 — Évolutions futures (si le projet continue)

| # | Sujet | Description |
|---|-------|-------------|
| P3-1 | Module facturation | Générer une facture PDF numérotée depuis un devis accepté et l'envoyer automatiquement avec numéro de bon de commande. |
| P3-2 | Agent multicanal | Déployer le même agent sur WhatsApp Business ou Messenger, sans changer la logique métier — cibler groupes scolaires et associations. |
| P3-3 | Multi-langue | Internationaliser le prompt et l'interface (anglais, espagnol) pour les groupes touristiques étrangers en France. |
| P3-4 | Analytics prédictifs | Revenue prévisionnel, taux de conversion par canal, coût d'acquisition, saisonnalité des demandes. |
| P3-5 | Intégration CRM externe | Synchronisation bidirectionnelle avec HubSpot ou Salesforce pour les équipes commerciales qui ont déjà un CRM en place. |
| P3-6 | Stockage PDF Supabase | Stocker les PDF dans Supabase Storage et renseigner `pdf_url` dans la table `devis` pour consultation ultérieure sans re-génération. |

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
- **Journal de décisions** : [`docs/journal-decisions.md`](docs/journal-decisions.md) — 6 choix techniques clés (Vercel AI SDK, Supabase, calcul déterministe, pdf-lib, Resend, streaming DEMANDE_ID) + rétrospective
- **Procédure équipes** : [`docs/procedure-equipes.md`](docs/procedure-equipes.md) — guide utilisateur pour les équipes commerciales

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
