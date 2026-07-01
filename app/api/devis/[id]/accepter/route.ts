import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDevisToken, generateDevisToken } from '@/lib/devis-token'
import { emailConfirmation } from '@/lib/email-templates'

const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neotravel-six.vercel.app'
const fromEmail  = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const isTestMode = fromEmail.includes('resend.dev')
const testEmail  = process.env.RESEND_TEST_EMAIL ?? 'biantuadikevin@gmail.com'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') ?? ''

  if (!verifyDevisToken(id, token)) {
    console.error(`[accepter] token invalide — id: ${id}, token reçu: ${token}, attendu: ${generateDevisToken(id)}`)
    return NextResponse.redirect(`${SITE_URL}/devis/invalide`)
  }

  const { data: devis, error } = await supabaseAdmin
    .from('devis')
    .select('id, statut, demande_id, prix_ttc')
    .eq('id', id)
    .single()

  if (error || !devis) {
    return NextResponse.redirect(`${SITE_URL}/devis/invalide`)
  }

  if (devis.statut === 'accepte') {
    return NextResponse.redirect(`${SITE_URL}/devis/confirme?already=1`)
  }

  if (devis.statut === 'expire' || devis.statut === 'refuse') {
    return NextResponse.redirect(`${SITE_URL}/devis/expire`)
  }

  // Récupère les infos du prospect pour l'email de confirmation
  const { data: demande } = devis.demande_id
    ? await supabaseAdmin
        .from('demandes')
        .select('nom_prospect, email, depart, destination, date_depart')
        .eq('id', devis.demande_id)
        .single()
    : { data: null }

  const [r1, r2] = await Promise.all([
    supabaseAdmin.from('devis').update({ statut: 'accepte' }).eq('id', id),

    devis.demande_id
      ? supabaseAdmin.from('demandes')
          .update({ statut: 'accepte', updated_at: new Date().toISOString() })
          .eq('id', devis.demande_id)
      : Promise.resolve({ error: null }),

    supabaseAdmin.from('logs').insert({
      demande_id:    devis.demande_id,
      action:        'devis_accepte_via_email',
      outil_utilise: 'lien_email',
    }),
  ])

  if (r1?.error) console.error('[accepter] devis update error:', r1.error)
  if (r2?.error) console.error('[accepter] demande update error:', r2.error)

  // Email de confirmation au prospect
  if (demande?.email) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const prenom = (demande.nom_prospect ?? 'Client').split(' ')[0]
    const dateDepart = demande.date_depart
      ? new Date(demande.date_depart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—'

    const html = emailConfirmation({
      prenom,
      depart:      demande.depart ?? '—',
      destination: demande.destination ?? '—',
      dateDepart,
      montantTTC:  devis.prix_ttc,
      siteUrl:     SITE_URL,
    })

    await resend.emails.send({
      from:    fromEmail,
      to:      isTestMode ? testEmail : demande.email,
      subject: isTestMode
        ? `[TEST → ${demande.email}] ✓ Votre réservation NeoTravel est confirmée`
        : '✓ Votre réservation NeoTravel est confirmée',
      html,
    }).catch(() => { /* ne bloque pas la redirection si l'email échoue */ })
  }

  return NextResponse.redirect(`${SITE_URL}/devis/confirme`)
}
