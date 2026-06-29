# NeoTravel — Journal de décisions techniques

**Projet :** EPITECH NeoTravel — Automatisation commerciale transport de groupe  
**Équipe :** Béni, Paul, Giovanni, Sarah  
**Période :** Juin 2026

---

## Décision 1 — Vercel AI SDK plutôt que n8n ou LangChain

**Contexte :** Il fallait orchestrer un agent IA capable d'appeler des outils (calcul devis, envoi email, écriture en base) depuis une interface web Next.js.

**Options évaluées :**
- n8n (no-code workflow automation)
- LangChain (framework Python/JS)
- Vercel AI SDK v7 (bibliothèque TypeScript native Next.js)

**Choix :** Vercel AI SDK v7

**Raisons :**
- Intégration native Next.js App Router (streaming, Server Components) — zéro friction
- API `streamText` + `tool()` + `stopWhen` : tout ce qu'on avait besoin sans surcharge
- TypeScript natif — les schémas Zod des tools sont vérifiés à la compilation
- n8n aurait nécessité une infrastructure séparée et ne permettait pas le streaming chat
- LangChain ajoutait une abstraction inutile pour notre cas d'usage simple (1 agent, 5 tools)

**Conséquence :** Le streaming de la réponse IA est géré nativement ; le `DEMANDE_ID` est injecté en fin de stream pour la persistance cross-request.

---

## Décision 2 — Supabase plutôt que PlanetScale / Firebase / PostgreSQL natif

**Contexte :** Besoin d'une base relationnelle hébergée avec accès temps réel pour le dashboard, et contrôle d'accès par table.

**Options évaluées :**
- PlanetScale (MySQL serverless)
- Firebase Firestore (NoSQL)
- PostgreSQL Railway ou Neon
- Supabase

**Choix :** Supabase

**Raisons :**
- RLS (Row Level Security) intégré — contrôle d'accès par table sans code supplémentaire
- Edge Functions Supabase pour les relances cron (pg_cron + pg_net) — tout dans le même écosystème
- Dashboard Supabase pour visualiser les données pendant le développement
- Client JavaScript officiel (`@supabase/supabase-js`) avec types générés depuis le schéma
- PlanetScale ne supporte pas les ENUM PostgreSQL (utilisés pour `statut_demande`)
- Firebase aurait imposé un modèle NoSQL inadapté aux jointures devis/demandes/clients

**Conséquence :** Toute la logique d'accès passe par `supabaseAdmin` (service role) côté serveur uniquement.

---

## Décision 3 — Calcul déterministe hors LLM (`calculer-devis.ts`)

**Contexte :** Le prix d'un devis ne peut pas dépendre de l'interprétation du LLM — un client mal intentionné pourrait manipuler le contexte pour obtenir un prix plus bas.

**Alternatives :**
- Laisser le LLM calculer en langage naturel (ex : "Pour 40 personnes à 200 km, le prix est...")
- Fournir les règles tarifaires dans le prompt et demander au LLM de calculer

**Choix :** Fonction TypeScript pure isolée, appelée via un tool

**Raisons :**
- **Fiabilité** : la fonction est testée par 13 tests Jest — les cas limites sont couverts
- **Sécurité** : le LLM ne peut pas négocier, arrondir ou inventer un prix
- **Auditabilité** : chaque devis est reproductible avec les mêmes paramètres
- **Évolutivité** : les tarifs sont désormais lus depuis la table `matrices` en base — modifiables sans redéploiement

**Conséquence :** Le prompt interdit explicitement à l'agent de calculer un prix lui-même.

---

## Décision 4 — pdf-lib plutôt que Puppeteer / wkhtmltopdf

**Contexte :** Génération d'un PDF de devis à envoyer par email en pièce jointe, côté serveur Next.js.

**Options évaluées :**
- Puppeteer (headless Chrome — HTML → PDF)
- wkhtmltopdf (CLI)
- jsPDF (client-side)
- pdf-lib (manipulation PDF bas niveau, Node.js)

**Choix :** pdf-lib

**Raisons :**
- Pas de dépendance Chrome/Chromium en production (incompatible Vercel Edge, lourd à déployer)
- pdf-lib fonctionne en environnement Node.js serverless sans binaires externes
- Le PDF généré est simple (lignes de texte structuré) — pas besoin de rendu HTML complet
- jsPDF ne tourne pas côté serveur de manière fiable

**Conséquence :** Les PDFs sont générés en mémoire et attachés directement à l'email — ils ne sont pas stockés (évolution P3-6).

---

## Décision 5 — Resend plutôt que SendGrid / Nodemailer

**Contexte :** Envoi d'emails transactionnels (devis PDF en pièce jointe).

**Options évaluées :**
- Nodemailer (SMTP direct)
- SendGrid
- Resend

**Choix :** Resend

**Raisons :**
- API REST simple, SDK TypeScript officiel, intégration en 10 lignes
- Domaine `onboarding@resend.dev` utilisable immédiatement en test sans vérification DNS
- Logs d'envoi dans le dashboard Resend — utile pour le debug en démo
- SendGrid a une API plus complexe pour un usage simple

**Conséquence :** `RESEND_FROM_EMAIL` peut être remplacé par une adresse vérifiée pour un déploiement client réel.

---

## Décision 6 — Streaming texte + marqueur `DEMANDE_ID` pour la persistance cross-request

**Contexte :** Le `demande_id` Supabase est créé côté serveur lors de l'appel `enregistrer_lead`. Il doit être réutilisé dans les appels suivants (calcul devis, envoi email) pour lier les enregistrements. HTTP est stateless — il faut un mécanisme pour le transmettre au client.

**Options évaluées :**
- Cookie de session
- Réponse JSON avec `demande_id` dans le body
- Marqueur injecté dans le stream texte

**Choix :** Marqueur `DEMANDE_ID:uuid` en fin de stream

**Raisons :**
- La route `/api/chat` renvoie un `text/plain` stream — on ne peut pas changer la structure de réponse sans casser le streaming
- Le client lit le stream caractère par caractère et peut détecter le marqueur via regex
- Stocké dans un `useRef` côté client — persiste entre les messages sans re-render
- Solution légère, sans infrastructure de session supplémentaire

**Conséquence :** Le client filtre le marqueur avant affichage (`buf.replace(/DEMANDE_ID:[a-f0-9-]{36}/g, '')`).

---

## Rétrospective

**Ce qui a bien fonctionné :**
- L'architecture tool-based de l'agent a bien résisté aux changements (ajout d'outils, modification du comportement sans toucher au code existant)
- La séparation calcul déterministe / LLM a évité tous les problèmes de fiabilité des prix
- Supabase + RLS a simplifié la sécurité des données sans code de contrôle d'accès custom

**Ce qu'on referait différemment :**
- Partir d'une route `/api/chat` unique dès le début (une route `/api/agent` alternative a créé de la confusion)
- Documenter les garde-fous HITL/RGPD dès le début du projet
- Mettre en place le test bout-en-bout plus tôt pour éviter les découvertes tardives

**Ce qui manque et serait prioritaire :**
- Déploiement de la Edge Function relances (code prêt, 15 min de déploiement)
- Authentification sur le dashboard (actuellement accessible sans login)
- Acceptation de devis en ligne (actuellement le prospect doit rappeler ou répondre par email)
