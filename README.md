# NeoTravel

Application Next.js pour qualifier des demandes de transport de groupe, calculer un devis, envoyer le devis par email et suivre les demandes dans Supabase.

## Getting Started

Installer les dependances puis lancer le serveur de developpement :

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Variables d'environnement

Creer un fichier `.env.local` avec :

```bash
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL="NeoTravel <onboarding@resend.dev>"
```

`RESEND_FROM_EMAIL` peut etre remplace par une adresse verifiee dans Resend.

## Devis PDF

La generation PDF est centralisee dans `lib/devis-pdf.ts`.

Le PDF contient :

- montant HT, TVA et TTC ;
- detail des lignes du devis ;
- coefficients appliques ;
- coordonnees du prospect ;
- reference du devis.

L'envoi email est centralise dans `lib/email-devis.ts`. La route `app/api/agent/route.ts` expose le tool `envoyer_email`, qui genere le PDF, l'attache a l'email Resend, cree une ligne dans `devis`, met la demande en statut `devis_envoye` et ajoute un log.

## Modifier le pricing

La logique de calcul est dans `lib/calculer-devis.ts`.

Les constantes a modifier en priorite sont :

- `PRIX_PAR_KM`
- `PRIX_MINIMUM`
- `DISTANCE_MAX_KM`
- `TVA`
- `MARGE`
- `PRIX_GUIDE_JOUR`
- `PRIX_NUIT_CHAUFFEUR`
- `CAPACITE_MAX`

Les coefficients sont dans `coefSaison`, `coefUrgence` et `coefCapacite`.

## Changer le prompt systeme

Le prompt de l'agent est la constante `SYSTEM_PROMPT` dans `app/api/agent/route.ts`.

## Ajouter un statut

Ajouter le statut dans :

- `neotravel_migration.sql`, enum `statut_demande` ;
- `types/index.ts`, type `StatutDemande` ;
- `app/api/agent/route.ts`, schema `mettreAJourStatutParams`.

## Tests

Les tests Jest du calcul de devis sont dans `__tests__/calculer-devis.test.ts`.

```bash
npm test
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
