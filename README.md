# NeoTravel — Automatisation des processus commerciaux

Application Next.js (App Router, TypeScript) qui qualifie des demandes de transport de groupe via un agent IA, calcule un devis, génère un PDF et l'envoie par email. Les données sont stockées dans Supabase.

**Stack :** Next.js · TypeScript · Supabase · Vercel AI SDK · Anthropic · OpenRouteService · pdf-lib · Resend · Zod · Jest

## Architecture

```
Prospect (chat) → Agent IA → calculer_distance() → calculer_devis() → PDF → Email (Resend)
                           → enregistrer_lead()   → Supabase CRM
                           → Edge Function cron    → Relances J+2 / J+5 / J+7
```

## Installation

```bash
npm install
npm run dev       # http://localhost:3000
npm run build
npm test          # Tests Jest du moteur de calcul
```

## Variables d'environnement

Créer `.env.local` à la racine — **ne jamais le committer** :

```bash
AI_GATEWAY_API_KEY=          # Vercel AI Gateway → anthropic/claude-sonnet-4-5
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Côté serveur uniquement (bypass RLS)
RESEND_API_KEY=
RESEND_FROM_EMAIL="NeoTravel <onboarding@resend.dev>"
ORS_API_KEY=                 # OpenRouteService (calcul distance automatique)
```

## Base de données Supabase

Schéma complet dans `neotravel_migration.sql`. Tables : `clients`, `demandes`, `matrices`, `devis`, `relances`, `logs`.

1. Ouvrir Supabase > SQL Editor
2. Coller et exécuter `neotravel_migration.sql`
3. Renseigner les variables Supabase dans `.env.local`

RLS activé sur toutes les tables — le backend utilise `service_role` pour les écritures.

## Agent IA

- **Route :** `POST /api/chat` (`app/api/chat/route.ts`)
- **Prompt :** `lib/agent/prompt.ts`
- **Tools :** `lib/agent/tools.ts`

| Tool | Rôle |
|------|------|
| `calculer_distance` | Géocode les villes et calcule la distance via ORS — appelé automatiquement dès que départ + destination sont connus |
| `calculer_devis` | Calcul déterministe du prix (jamais délégué au LLM) |
| `enregistrer_lead` | Upsert client + création demande dans Supabase |
| `envoyer_devis_par_email` | Génère le PDF et envoie via Resend |
| `mettre_a_jour_statut` | Change le statut d'une demande CRM |
| `escalader_humain` | Transfert vers commercial humain (> 59 passagers, trajet international) |

### Garde-fous

- **Calcul déterministe :** le LLM ne touche jamais aux prix — toute la logique tarifaire est dans `lib/calculer-devis.ts` (testée par Jest)
- **Validation Zod :** chaque tool déclare un `inputSchema` — aucun paramètre non-typé n'atteint l'`execute`
- **Limite d'étapes :** `stopWhen: isStepCount(10)` évite les boucles d'exploitation
- **HITL :** `escalader_humain()` se déclenche automatiquement pour les cas hors barème

## Modifier le pricing

Constantes dans `lib/calculer-devis.ts` :

```ts
const PRIX_MINIMUM        = 350   // € plancher
const TVA                 = 0.10
const MARGE               = 0.15
const PRIX_GUIDE_JOUR     = 80    // € / jour
const PRIX_NUIT_CHAUFFEUR = 120   // € / nuit
const CAPACITE_MAX        = 59    // au-delà → escalade humaine
```

Le prix par km est lu depuis la table `matrices` (Supabase) selon le nombre de passagers.
Les coefficients saison, urgence et capacité sont dans `coefSaison()`, `coefUrgence()`, `coefCapacite()`.

Après modification : `npm test` — les tests vérifient les cas nominaux et limites.

## Edge Functions — Relances automatiques

| Étape | Déclencheur | Action |
|-------|-------------|--------|
| Relance 1 | J+2 après `devis_envoye` | Email + statut → `relance_1` |
| Relance 2 | J+3 après Relance 1 (J+5) | Email + statut → `relance_2` |
| Clôture | J+2 après Relance 2 (J+7) | Statut → `cloture` |

**Déploiement :**
```bash
npx supabase functions deploy relancer-prospect --project-ref bfqkuwbtqqyisjzrjqep
```
Ajouter `RESEND_API_KEY` dans Supabase > Edge Functions > relancer-prospect > Secrets.

**Activation du cron :**
1. Supabase > Database > Extensions : activer `pg_cron` et `pg_net`
2. SQL Editor : exécuter `supabase/functions/relancer-prospect/cron-setup.sql` (08h00 UTC quotidien)

## Backlog

> État à la soutenance (1er juillet 2026). Le flux complet est opérationnel : prospect → CRM → devis → email → dashboard → relances.

### P1 — Corrections immédiates

| # | Sujet | État |
|---|-------|------|
| P1-1 | Persistance devis/client après conversation | ✅ Résolu — `demande_id` passé via ref mutable aux tools |
| P1-2 | Calcul distance automatique (ORS) | ✅ Résolu — tool `calculer_distance` + détection international |
| P1-3 | Edge Function relances | ✅ Déployée — projet `bfqkuwbtqqyisjzrjqep` |
| P1-4 | Acceptation / refus devis en ligne | ✅ Résolu — liens dans l'email → endpoints `/accepter` et `/refuser` |

### P2 — Améliorations prioritaires

| # | Sujet | Description |
|---|-------|-------------|
| P2-1 | Notifications commerciaux | Email interne à l'équipe sur `cas_complexe` ou `accepte` |
| P2-2 | Relances SMS / WhatsApp | Canal prévu dans le schéma (`canal_relance enum`) — brancher Twilio |
| P2-3 | Stockage PDF Supabase | Stocker les PDFs et renseigner `pdf_url` dans `devis` |

### P2 — Évolutions futures

| # | Sujet | Description |
|---|-------|-------------|
| P3-1 | Module facturation | Facture PDF numérotée depuis un devis accepté |
| P3-2 | Agent multicanal | WhatsApp Business / Messenger sans changer la logique métier |
| P3-3 | Multi-langue | Prompt + interface en anglais/espagnol |
| P3-4 | Analytics prédictifs | Taux de conversion, saisonnalité, revenu prévisionnel |
| P3-5 | Intégration CRM externe | Sync HubSpot / Salesforce |

## Structure

```
app/
  api/chat/route.ts          Route agent IA (streaming)
  dashboard/                 Dashboard CRM (KPIs, demandes, devis, clients, relances)
  page.tsx                   Landing conversationnelle
lib/
  agent/prompt.ts            Prompt système
  agent/tools.ts             6 tools de l'agent
  calculer-devis.ts          Moteur de pricing déterministe
  devis-pdf.ts               Génération PDF (pdf-lib)
  email-devis.ts             Envoi email (Resend)
  supabase.ts                Clients Supabase (public + admin)
supabase/functions/
  relancer-prospect/         Edge Function cron relances
neotravel_migration.sql      Schéma Supabase complet
__tests__/
  calculer-devis.test.ts     Tests Jest du pricing
docs/
  journal-decisions.md       6 décisions techniques + rétrospective
  procedure-equipes.md       Guide utilisateur équipes commerciales
```

## Ressources

- **Figma :** [Maquette NeoTravel](https://www.figma.com/design/gpKMpdgnx2Vkh3eeqypJAN/NEOTRAVEL-%E2%80%94-Maquette-Site-Web--copie-?node-id=0-1&p=f&t=1MI9omxJKytwja2W-0)
- **Journal de décisions :** [`docs/journal-decisions.md`](docs/journal-decisions.md)
- **Procédure équipes commerciales :** [`docs/procedure-equipes.md`](docs/procedure-equipes.md)
- **Procédure repreneur (technique) :** [`docs/procedure-repreneur.html`](docs/procedure-repreneur.html)
