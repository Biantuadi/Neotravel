# NeoTravel — Automatisation des processus commerciaux

Projet scolaire EPITECH MBA1 — Juin 2026

NeoTravel est un intermédiaire de transport de groupe. Ce projet automatise son processus commercial : de la demande de devis initiale jusqu'à l'envoi du PDF et aux relances automatiques, en passant par un agent IA conversationnel.

## Architecture

```
Prospect (chat) → Agent IA (Vercel AI SDK) → calculer_devis() → PDF (pdf-lib) → Email (Resend)
                                           → Supabase (stockage CRM)
                                           → Edge Functions Supabase (relances cron J+2/J+3/J+7)
```

**Stack technique :**
- **Next.js** (App Router, TypeScript) — framework principal
- **Vercel AI SDK** — agent IA avec tool calling (jamais de calcul de prix par le LLM)
- **Supabase** — base de données PostgreSQL (Demandes, Matrices, Devis, Relances, Logs, Clients)
- **Resend** — envoi d'emails transactionnels
- **pdf-lib** — génération du devis PDF côté serveur
- **Jest + ts-jest** — tests de la fonction de pricing

## Structure du projet

```
neotravel/
├── app/
│   ├── api/agent/          # Route POST de l'agent IA (streaming)
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
├── neotravel_migration.sql # Schéma BDD complet — à exécuter dans Supabase SQL Editor
└── __tests__/
    └── calculer-devis.test.ts  # 12 tests Jest sur la fonction de pricing
```

## Installation locale

### Prérequis
- Node.js 18+
- Un projet Supabase créé (voir section Variables d'environnement)

### 1. Cloner le repo

```bash
git clone https://github.com/Biantuadi/Neotravel.git
cd neotravel
npm install
```

### 2. Variables d'environnement

Créer un fichier `.env.local` à la racine (**ne jamais committer ce fichier**) :

```env
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=NeoTravel <contact@votredomaine.com>
```

| Variable | Description | Où la trouver |
|---|---|---|
| `ANTHROPIC_API_KEY` | Clé API Anthropic pour l'agent IA | anthropic.com > API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase (lecture seule) | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase (contourne le RLS) | Supabase > Settings > API |
| `RESEND_API_KEY` | Clé API pour l'envoi d'emails | resend.com — free tier : 3 000 emails/mois |
| `RESEND_FROM_EMAIL` | Expéditeur affiché dans les emails | Doit correspondre à un domaine vérifié dans Resend |

### 3. Initialiser la base de données

Aller dans **Supabase > SQL Editor**, coller le contenu de `neotravel_migration.sql` et exécuter. Cela crée toutes les tables, enums, index et politiques RLS.

### 4. Lancer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) — ou double-cliquer sur `start-dev.bat` (Windows).

### 5. Lancer les tests

```bash
npm test
```

## Règle de pricing (SOCLE)

La fonction `calculer_devis()` est **déterministe et ne doit jamais être appelée directement par le LLM**. L'agent IA l'expose comme un tool Vercel AI SDK — le LLM collecte les paramètres via le chat, puis appelle le tool. Tout le calcul de prix est fait en code.

**Matrices appliquées dans l'ordre :**
1. Prix de base = distance × tarif/km selon le véhicule
2. Coefficient saisonnalité (selon mois du départ)
3. Coefficient urgence (selon délai demande → départ)
4. Coefficient capacité (selon nombre de passagers)
5. Options (guide, nuit chauffeur, péages)
6. Marge commerciale +15%
7. TVA 10%

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

## Ressources

- **Figma** : [NeoTravel — Maquette Site Web](https://www.figma.com/design/gpKMpdgnx2Vkh3eeqypJAN/NEOTRAVEL-%E2%80%94-Maquette-Site-Web--copie-?node-id=0-1&p=f&t=1MI9omxJKytwja2W-0)

## Équipe

| Membre | Rôle |
|--------|------|
| Giovanni | `calculer_devis()`, tools agent IA, relances & tests finaux |
| Béni | Supabase, route `/api/agent`, dashboard direction |
| Paul | Init Next.js, interface prospect, documentation équipes |
| Sarah | Maquettes & flow agent, génération PDF, documentation technique |

## Calendrier

| Livrable | Date |
|----------|------|
| Dossier de cadrage (L1) | 24 juin 2026 |
| Prototype + artefacts (L2/L3) | 29 juin 2026 |
| Soutenance | 1er juillet 2026 |
