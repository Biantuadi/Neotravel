import { Resend } from 'resend'
import type { Devis } from '@/lib/calculer-devis'
import { genererDevisPdf, type CoordonneesProspect } from '@/lib/devis-pdf'
import { emailDevis } from '@/lib/email-templates'
import { buildAcceptUrl, buildRefusUrl, generateDevisToken } from '@/lib/devis-token'
import { supabaseAdmin } from '@/lib/supabase'

export interface EnvoyerEmailDevisParams {
  prospect: CoordonneesProspect & { email: string }
  devis: Devis
  reference?: string
  devisId?: string   // UUID Supabase pour le lien d'acceptation
  nbPassagers?: number
}

const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const isTestMode = fromEmail.includes('resend.dev')
const testRedirectTo = process.env.RESEND_TEST_EMAIL ?? 'guilleminotpaul54@gmail.com'

export async function envoyerEmailDevis({
  prospect,
  devis,
  reference,
  devisId,
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neotravel-six.vercel.app'
  const ctaUrl = devisId ? buildAcceptUrl(devisId, baseUrl) : baseUrl
  const refusUrl = devisId ? buildRefusUrl(devisId, baseUrl) : undefined

  // Stocker les tokens en DB pour que la fonction edge puisse les réutiliser
  if (devisId) {
    await supabaseAdmin.from('devis').update({
      accept_token: generateDevisToken(devisId),
      refuse_token: generateDevisToken(devisId + '_refuse'),
    }).eq('id', devisId)
  }

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
    ctaUrl,
    refusUrl,
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
