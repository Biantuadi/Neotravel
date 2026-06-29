# NeoTravel — Automatisation des processus commerciaux

Projet scolaire EPITECH MBA1 — Juin 2026

NeoTravel est un intermédiaire de transport de groupe. Ce projet automatise son processus commercial : de la demande de devis initiale jusqu'à l'envoi du PDF et aux relances automatiques, en passant par un agent IA conversationnel.

## Architecture

```
Prospect (chat) → Agent IA (Vercel AI SDK) → calculer_devis() → PDF (pdf-lib) → Email (Resend)
                                           → Supabase (stockage)
                                           → n8n (relances automatiques)
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
│   ├── api/
│   │   └── agent/          # Route API de l'agent IA (Giovanni)
│   ├── dashboard/          # Dashboard direction (Giovanni)
│   └── page.tsx            # Landing conversationnelle (Sarah)
├── lib/
│   ├── calculer-devis.ts   # Fonction de pricing déterministe (Giovanni)
│   ├── supabase.ts         # Client Supabase
│   └── tools/              # Tools Vercel AI SDK (Paul)
├── types/
│   └── index.ts            # Types TypeScript partagés
└── __tests__/
    └── calculer-devis.test.ts  # Tests Jest
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

Créer un fichier `.env.local` à la racine (ne jamais le committer) :

```env
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
```

- **ANTHROPIC_API_KEY** : clé API Anthropic (compte anthropic.com)
- **NEXT_PUBLIC_SUPABASE_URL** : URL du projet Supabase (Settings > API)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** : clé publique Supabase (Settings > API)
- **SUPABASE_SERVICE_ROLE_KEY** : clé service Supabase (Settings > API — ne pas exposer côté client)
- **RESEND_API_KEY** : clé API Resend (resend.com — free tier : 3 000 emails/mois)

### 3. Lancer en développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### 4. Lancer les tests

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

## Déploiement Vercel

1. Connecter le repo GitHub sur [vercel.com](https://vercel.com)
2. Ajouter les variables d'environnement dans Settings > Environment Variables
3. Déployer — chaque push sur `main` déclenche un déploiement automatique

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
