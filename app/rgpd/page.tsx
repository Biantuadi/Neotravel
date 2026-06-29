import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NeoTravel - Politique RGPD',
  description: 'Politique de protection des données personnelles de NeoTravel.',
}

const sections = [
  {
    title: '1. Responsable du traitement',
    body: [
      'NEOTRAVEL SAS — 55 Rue Raspail, 92300 Levallois-Perret — RCS Nanterre 529 307 167 — est responsable du traitement des donnees collectees sur ce site dans le cadre des demandes de devis de transport de groupe.',
      'Pour toute question relative aux donnees personnelles, vous pouvez contacter notre equipe a l adresse : reservation@autocar-location.com',
    ],
  },
  {
    title: '2. Données collectées',
    body: [
      'Lorsqu un prospect utilise l assistant conversationnel, NeoTravel peut collecter son nom, son adresse email, son telephone, la ville de depart, la destination, les dates de trajet, le nombre de passagers et les informations utiles a la preparation du devis.',
      'Des donnees techniques sont conservees dans les logs applicatifs (horodatage, actions de l agent IA, statut des demandes) afin d assurer le suivi du service et la tracabilite des operations.',
    ],
  },
  {
    title: '3. Finalités du traitement',
    body: [
      'Les donnees sont utilisees pour qualifier la demande, calculer un devis, envoyer le devis au prospect, assurer le suivi commercial et programmer des relances automatiques.',
      'Le calcul du devis est realise de maniere deterministe par un moteur de tarification — le modele IA ne prend aucune decision tarifaire autonome. Les demandes hors barème (groupe de plus de 59 personnes, trajet international) sont systematiquement transmises a un conseiller humain.',
    ],
  },
  {
    title: '4. Base légale',
    body: [
      'Le traitement repose sur l execution de mesures precontractuelles lorsque le prospect demande un devis (article 6.1.b du RGPD).',
      'Le suivi des demandes, la securisation du service et l amelioration des processus internes reposent sur l interet legitime de NeoTravel (article 6.1.f). Vous pouvez vous opposer a ces traitements a tout moment en nous contactant.',
    ],
  },
  {
    title: '5. Destinataires et transferts hors UE',
    body: [
      'Les donnees sont accessibles aux personnes habilitees chez NeoTravel et aux sous-traitants techniques suivants : Supabase Inc. (hebergement base de donnees — region EU disponible), Resend Inc. (envoi d emails — Etats-Unis), Anthropic PBC (modele IA — Etats-Unis), OpenRouteService / HeiGIT (calcul de distance — Allemagne).',
      'Les transferts vers Resend et Anthropic, etablis aux Etats-Unis, sont encadres par les clauses contractuelles types de la Commission europeenne (CCT) conformement a l article 46 du RGPD.',
    ],
  },
  {
    title: '6. Durée de conservation',
    body: [
      'Les demandes et devis sont conserves 3 ans a compter du dernier contact, conformement aux obligations legales en matiere de droit commercial.',
      'Les logs techniques sont conserves 12 mois a compter de leur creation, puis supprimes automatiquement.',
    ],
  },
  {
    title: '7. Droits des personnes',
    body: [
      'Conformement au RGPD, vous disposez d un droit d acces, de rectification, d effacement, de limitation, d opposition et de portabilite de vos donnees.',
      'Pour exercer ces droits, contactez-nous a reservation@autocar-location.com. Une reponse sera apportee dans un delai d un mois conformement a l article 12 du RGPD.',
      'Vous pouvez egalement introduire une reclamation aupres de la CNIL (www.cnil.fr) si vous estimez que vos droits ne sont pas respectes.',
    ],
  },
  {
    title: '8. Sécurité',
    body: [
      'NeoTravel met en place des mesures techniques et organisationnelles pour proteger les donnees personnelles contre l acces non autorise, la perte, l alteration ou la divulgation non souhaitee.',
      'L acces aux donnees en base est protege par des politiques de securite au niveau des lignes (Row Level Security) et les echanges transitent exclusivement via des connexions chiffrees (HTTPS / TLS).',
    ],
  },
  {
    title: '9. Cookies et traceurs',
    body: [
      'Le site n utilise pas de cookies publicitaires ni de traceurs marketing tiers. Aucune donnee de navigation n est partagee avec des plateformes publicitaires.',
      'Si des outils d analyse de trafic sont ajoutes ulterieurement, cette page sera mise a jour et un mecanisme de consentement sera mis en place conformement aux recommandations de la CNIL.',
    ],
  },
]

export default function RgpdPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#14141a]">
      <section className="border-b border-[#e4e8ee] bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2e7d32] text-white">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 6v6" />
                <path d="M15 6v6" />
                <path d="M2 12h19.6" />
                <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="15" cy="18" r="2" />
              </svg>
            </span>
            <span className="text-[15px] font-extrabold tracking-wide">NEOTRAVEL</span>
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-[#d8dee7] px-4 py-2 text-[13px] font-semibold text-[#344054] transition-colors hover:border-[#2e7d32] hover:text-[#2e7d32]"
          >
            Retour au site
          </Link>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.18em] text-[#2e7d32]">
            Données personnelles
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-[#101828] sm:text-5xl">
            Politique RGPD et protection des données
          </h1>
          <p className="mt-5 max-w-3xl text-[16px] leading-8 text-[#667085]">
            Cette page explique comment NeoTravel collecte, utilise et protège les données personnelles dans le cadre des demandes de devis et de l&apos;assistant conversationnel.
          </p>
          <p className="mt-4 text-[13px] font-medium text-[#98a2b3]">
            Dernière mise à jour : 29 juin 2026
          </p>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit border-l-4 border-[#2e7d32] bg-white px-5 py-5 shadow-sm">
            <p className="text-[13px] font-bold text-[#101828]">Résumé</p>
            <p className="mt-2 text-[13px] leading-6 text-[#667085]">
              Les données servent à répondre aux demandes de devis, envoyer les documents commerciaux et assurer le suivi des prospects.
            </p>
          </aside>

          <div className="space-y-5">
            {sections.map((section) => (
              <article key={section.title} className="bg-white px-6 py-6 shadow-sm sm:px-8">
                <h2 className="text-[18px] font-extrabold text-[#101828]">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-[14px] leading-7 text-[#667085]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}

            <article className="border border-[#d8eadc] bg-[#f0f8f1] px-6 py-6 sm:px-8">
              <h2 className="text-[18px] font-extrabold text-[#1b5e20]">À adapter avant production</h2>
              <p className="mt-3 text-[14px] leading-7 text-[#315f38]">
                Cette page est une base de travail pour le projet NeoTravel. Avant une mise en production réelle, elle doit être relue et complétée avec les informations juridiques exactes de l&apos;entreprise, les durées de conservation définitives et la liste complète des sous-traitants.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}