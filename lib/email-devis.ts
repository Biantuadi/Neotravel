import { Resend } from 'resend'
import type { Devis } from '@/lib/calculer-devis'
import { genererDevisPdf, type CoordonneesProspect } from '@/lib/devis-pdf'
import { emailDevis } from '@/lib/email-templates'

export interface EnvoyerEmailDevisParams {
  prospect: CoordonneesProspect & { email: string }
  devis: Devis
  reference?: string
  nbPassagers?: number
}

const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const isTestMode = fromEmail.includes('resend.dev')
const testRedirectTo = process.env.RESEND_TEST_EMAIL ?? 'biantuadikevin@gmail.com'

export async function envoyerEmailDevis({
  prospect,
  devis,
  reference,
  nbPassagers = 1,
}: EnvoyerEmailDevisParams): Promise<{ id?: string }> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY manquante.')
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const pdfBytes = await genererDevisPdf({ devis, prospect, reference })
  const pdfContent = Buffer.from(pdfBytes)

  const toEmail = isTestMode ? testRedirectTo : prospect.email
  const prenom = prospect.nom.split(' ')[0]
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const html = emailDevis({
    prenom,
    depart: prospect.depart ?? '—',
    destination: prospect.destination ?? '—',
    dateDepart: prospect.dateDepart
      ? new Date(prospect.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—',
    nbPassagers,
    typeVehicule: typeof devis.vehicule === 'string' ? devis.vehicule : undefined,
    montantTTC: devis.prixTTC,
    devisId: reference ?? 'N/A',
    dateGeneration: today,
    ctaUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neotravel.fr',
  })

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: isTestMode
      ? `[TEST → ${prospect.email}] Votre devis NeoTravel`
      : 'Votre devis NeoTravel',
    html,
    attachments: [
      {
        filename: `${reference ?? 'devis-neotravel'}.pdf`,
        content: pdfContent,
      },
    ],
  })

  if (error) {
    throw new Error(error.message)
  }

  return { id: data?.id }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
