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
      'NeoTravel est responsable du traitement des données collectées sur ce site dans le cadre des demandes de devis de transport de groupe.',
      "Pour toute question relative aux données personnelles, vous pouvez contacter notre délégué à la protection des données par email à dpo@neotravel.fr ou par téléphone au 09 80 40 04 84.",
    ],
  },
  {
    title: '2. Données collectées',
    body: [
      "Lorsqu'un prospect utilise le formulaire ou l'assistant conversationnel, NeoTravel peut collecter son nom, son adresse email, son téléphone, la ville de départ, la destination, les dates de trajet, le nombre de passagers et les informations utiles à la préparation du devis.",
      'Des données techniques peuvent aussi être conservées dans les logs applicatifs afin de suivre le bon fonctionnement du service et les actions réalisées par l\'agent IA.',
    ],
  },
  {
    title: '3. Finalités du traitement',
    body: [
      "Les données sont utilisées pour qualifier la demande, calculer un devis, envoyer le devis au prospect, assurer le suivi commercial, programmer des relances et améliorer la qualité du service.",
      "Les données ne sont pas utilisées pour prendre une décision entièrement automatisée produisant un effet juridique. Les cas complexes peuvent être transmis à un conseiller humain.",
    ],
  },
  {
    title: '4. Base légale',
    body: [
      "Le traitement repose sur l'exécution de mesures précontractuelles lorsque le prospect demande un devis.",
      "Certaines données peuvent également être traitées sur la base de l'intérêt légitime de NeoTravel, notamment pour le suivi des demandes, la sécurisation du service et l'amélioration des processus internes.",
    ],
  },
  {
    title: '5. Destinataires des données',
    body: [
      "Les données sont accessibles uniquement aux personnes habilitées chez NeoTravel et aux prestataires techniques nécessaires au fonctionnement du service.",
      "Le projet utilise notamment Supabase (base de données), Resend (envoi des emails) et Anthropic — Claude API (traitement des messages de l'assistant conversationnel). Ces prestataires agissent en qualité de sous-traitants et sont soumis à des obligations de confidentialité.",
    ],
  },
  {
    title: '6. Durée de conservation',
    body: [
      "Les demandes et devis sont conservés pendant la durée nécessaire au suivi commercial, puis archivés ou supprimés selon les obligations légales applicables.",
      "Les logs techniques sont conservés pour une durée limitée, proportionnée aux besoins de diagnostic, de sécurité et de démonstration du projet.",
    ],
  },
  {
    title: '7. Droits des personnes',
    body: [
      "Conformément au RGPD, chaque personne dispose d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de ses données.",
      "Pour exercer ces droits, vous pouvez contacter NeoTravel à l'adresse dpo@neotravel.fr. Une réponse sera apportée dans les délais prévus par la réglementation.",
      "Vous pouvez également introduire une réclamation auprès de la CNIL si vous estimez que vos droits ne sont pas respectés.",
    ],
  },
  {
    title: '8. Sécurité',
    body: [
      "NeoTravel met en place des mesures techniques et organisationnelles pour protéger les données personnelles contre l'accès non autorisé, la perte, l'altération ou la divulgation.",
      "Les clés d'API et variables sensibles restent côté serveur et ne sont jamais publiées dans le dépôt Git.",
    ],
  },
  {
    title: '9. Cookies et traceurs',
    body: [
      "Dans l'état actuel du projet, aucun dispositif publicitaire ou traceur marketing n'est utilisé.",
      "Si des outils d'analyse ou de suivi sont ajoutés, cette page devra être mise à jour et un mécanisme de consentement devra être prévu lorsque la loi l'exige.",
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