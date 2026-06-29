import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NeoTravel - Politique RGPD',
  description: 'Politique de protection des donnees personnelles de NeoTravel.',
}

const sections = [
  {
    title: '1. Responsable du traitement',
    body: [
      'NeoTravel est responsable du traitement des donnees collectees sur ce site dans le cadre des demandes de devis de transport de groupe.',
      'Pour toute question relative aux donnees personnelles, le prospect peut contacter l equipe NeoTravel via les coordonnees indiquees sur le site.',
    ],
  },
  {
    title: '2. Donnees collectees',
    body: [
      'Lorsqu un prospect utilise le formulaire ou l assistant conversationnel, NeoTravel peut collecter son nom, son adresse email, son telephone, la ville de depart, la destination, les dates de trajet, le nombre de passagers et les informations utiles a la preparation du devis.',
      'Des donnees techniques peuvent aussi etre conservees dans les logs applicatifs afin de suivre le bon fonctionnement du service et les actions realisees par l agent IA.',
    ],
  },
  {
    title: '3. Finalites du traitement',
    body: [
      'Les donnees sont utilisees pour qualifier la demande, calculer un devis, envoyer le devis au prospect, assurer le suivi commercial, programmer des relances et ameliorer la qualite du service.',
      'Les donnees ne sont pas utilisees pour prendre une decision entierement automatisee produisant un effet juridique. Les cas complexes peuvent etre transmis a un conseiller humain.',
    ],
  },
  {
    title: '4. Base legale',
    body: [
      'Le traitement repose sur l execution de mesures precontractuelles lorsque le prospect demande un devis.',
      'Certaines donnees peuvent egalement etre traitees sur la base de l interet legitime de NeoTravel, notamment pour le suivi des demandes, la securisation du service et l amelioration des processus internes.',
    ],
  },
  {
    title: '5. Destinataires des donnees',
    body: [
      'Les donnees sont accessibles uniquement aux personnes habilitees chez NeoTravel et aux prestataires techniques necessaires au fonctionnement du service.',
      'Le projet utilise notamment Supabase pour la base de donnees, Resend pour l envoi des emails et un fournisseur de modele IA pour traiter les messages de l assistant.',
    ],
  },
  {
    title: '6. Duree de conservation',
    body: [
      'Les demandes et devis sont conserves pendant la duree necessaire au suivi commercial, puis archives ou supprimes selon les obligations legales applicables.',
      'Les logs techniques sont conserves pour une duree limitee, proportionnee aux besoins de diagnostic, de securite et de demonstration du projet.',
    ],
  },
  {
    title: '7. Droits des personnes',
    body: [
      'Conformement au RGPD, chaque personne dispose d un droit d acces, de rectification, d effacement, de limitation, d opposition et de portabilite de ses donnees.',
      'Pour exercer ces droits, la personne peut contacter NeoTravel. Une reponse sera apportee dans les delais prevus par la reglementation.',
      'La personne peut egalement introduire une reclamation aupres de la CNIL si elle estime que ses droits ne sont pas respectes.',
    ],
  },
  {
    title: '8. Securite',
    body: [
      'NeoTravel met en place des mesures techniques et organisationnelles pour proteger les donnees personnelles contre l acces non autorise, la perte, l alteration ou la divulgation.',
      'Les cles d API et variables sensibles doivent rester cote serveur et ne jamais etre publiees dans le depot Git.',
    ],
  },
  {
    title: '9. Cookies et traceurs',
    body: [
      'Dans l etat actuel du projet, aucun dispositif publicitaire ou traceur marketing n est documente.',
      'Si des outils d analyse ou de suivi sont ajoutes, cette page devra etre mise a jour et un mecanisme de consentement devra etre prevu lorsque la loi l exige.',
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
            Donnees personnelles
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-[#101828] sm:text-5xl">
            Politique RGPD et protection des donnees
          </h1>
          <p className="mt-5 max-w-3xl text-[16px] leading-8 text-[#667085]">
            Cette page explique comment NeoTravel collecte, utilise et protege les donnees personnelles dans le cadre des demandes de devis et de l assistant conversationnel.
          </p>
          <p className="mt-4 text-[13px] font-medium text-[#98a2b3]">
            Derniere mise a jour : 29 juin 2026
          </p>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit border-l-4 border-[#2e7d32] bg-white px-5 py-5 shadow-sm">
            <p className="text-[13px] font-bold text-[#101828]">Resume</p>
            <p className="mt-2 text-[13px] leading-6 text-[#667085]">
              Les donnees servent a repondre aux demandes de devis, envoyer les documents commerciaux et assurer le suivi des prospects.
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
              <h2 className="text-[18px] font-extrabold text-[#1b5e20]">A adapter avant production</h2>
              <p className="mt-3 text-[14px] leading-7 text-[#315f38]">
                Cette page est une base de travail pour le projet NeoTravel. Avant une mise en production reelle, elle doit etre relue et completee avec les informations juridiques exactes de l entreprise, les coordonnees du responsable, les durees de conservation definitives et la liste complete des sous-traitants.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
