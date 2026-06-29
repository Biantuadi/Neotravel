import { Resend } from 'resend'
import type { Devis } from '@/lib/calculer-devis'
import { genererDevisPdf, type CoordonneesProspect } from '@/lib/devis-pdf'

export interface EnvoyerEmailDevisParams {
  prospect: CoordonneesProspect & { email: string }
  devis: Devis
  reference?: string
}

const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const isTestMode = fromEmail.includes('resend.dev')
const testRedirectTo = process.env.RESEND_TEST_EMAIL ?? 'biantuadikevin@gmail.com'

export async function envoyerEmailDevis({
  prospect,
  devis,
  reference,
}: EnvoyerEmailDevisParams): Promise<{ id?: string }> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY manquante.')
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const pdfBytes = await genererDevisPdf({ devis, prospect, reference })
  const pdfContent = Buffer.from(pdfBytes)

  const toEmail = isTestMode ? testRedirectTo : prospect.email

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: isTestMode
      ? `[TEST → ${prospect.email}] Votre devis NeoTravel`
      : 'Votre devis NeoTravel',
    html: `
      <p>Bonjour ${escapeHtml(prospect.nom)},</p>
      <p>Merci pour votre demande. Vous trouverez votre devis NeoTravel en piece jointe.</p>
      <p><strong>Montant TTC : ${formatMoney(devis.prixTTC)}</strong></p>
      <p>Notre equipe reste disponible pour ajuster le trajet ou valider les details.</p>
      <p>Bien cordialement,<br />L'equipe NeoTravel</p>
    `,
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
