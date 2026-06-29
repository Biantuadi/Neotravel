import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { emailCourtoisieRefus, emailConfirmation } from '@/lib/email-templates'

const STATUTS_VALIDES = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'] as const
type Statut = typeof STATUTS_VALIDES[number]

const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neotravel-six.vercel.app'
const fromEmail  = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const isTestMode = fromEmail.includes('resend.dev')
const testEmail  = process.env.RESEND_TEST_EMAIL ?? 'biantuadikevin@gmail.com'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const statut = body.statut as Statut

  if (!STATUTS_VALIDES.includes(statut)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const { data: devis, error: fetchError } = await supabaseAdmin
    .from('devis')
    .select('id, demande_id, statut, prix_ttc')
    .eq('id', id)
    .single()

  if (fetchError || !devis) {
    return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
  }

  const updates: Record<string, unknown> = { statut }
  if (statut === 'envoye' && devis.statut === 'brouillon') {
    updates.envoye_le = new Date().toISOString()
  }

  await supabaseAdmin.from('devis').update(updates).eq('id', id)

  // Synchro statut demande associée
  if (devis.demande_id && (statut === 'accepte' || statut === 'refuse')) {
    await supabaseAdmin
      .from('demandes')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', devis.demande_id)
  }

  await supabaseAdmin.from('logs').insert({
    demande_id:    devis.demande_id,
    action:        `statut_devis_${statut}`,
    outil_utilise: 'backoffice_manuel',
  })

  // Email automatique selon le nouveau statut
  if ((statut === 'refuse' || statut === 'accepte') && devis.demande_id) {
    const { data: demande } = await supabaseAdmin
      .from('demandes')
      .select('nom_prospect, email, depart, destination, date_depart')
      .eq('id', devis.demande_id)
      .single()

    if (demande?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const prenom = (demande.nom_prospect ?? 'Client').split(' ')[0]

      if (statut === 'refuse') {
        const html = emailCourtoisieRefus({
          prenom,
          depart:      demande.depart ?? '—',
          destination: demande.destination ?? '—',
          siteUrl:     SITE_URL,
        })
        await resend.emails.send({
          from:    fromEmail,
          to:      isTestMode ? testEmail : demande.email,
          subject: isTestMode
            ? `[TEST → ${demande.email}] NeoTravel — Nous prenons note de votre décision`
            : 'NeoTravel — Nous prenons note de votre décision',
          html,
        }).catch(() => {})
      }

      if (statut === 'accepte') {
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
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
