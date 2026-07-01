import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDevisToken } from '@/lib/devis-token'
import { emailCourtoisieRefus } from '@/lib/email-templates'

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
    return NextResponse.redirect(`${SITE_URL}/devis/invalide`)
  }

  const { data: devis, error } = await supabaseAdmin
    .from('devis')
    .select('id, statut, demande_id')
    .eq('id', id)
    .single()

  if (error || !devis) {
    return NextResponse.redirect(`${SITE_URL}/devis/invalide`)
  }

  if (devis.statut === 'refuse') {
    return NextResponse.redirect(`${SITE_URL}/devis/refuse?already=1`)
  }

  if (devis.statut === 'accepte') {
    return NextResponse.redirect(`${SITE_URL}/devis/confirme?already=1`)
  }

  const { data: demande } = devis.demande_id
    ? await supabaseAdmin
        .from('demandes')
        .select('nom_prospect, email, depart, destination')
        .eq('id', devis.demande_id)
        .single()
    : { data: null }

  const [r1, r2] = await Promise.all([
    supabaseAdmin.from('devis').update({ statut: 'refuse' }).eq('id', id),

    devis.demande_id
      ? supabaseAdmin.from('demandes')
          .update({ statut: 'refuse', updated_at: new Date().toISOString() })
          .eq('id', devis.demande_id)
      : Promise.resolve({ error: null }),

    supabaseAdmin.from('logs').insert({
      demande_id:    devis.demande_id,
      action:        'devis_refuse_via_email',
      outil_utilise: 'lien_email',
    }),
  ])

  if (r1?.error) console.error('[refuser] devis update error:', r1.error)
  if (r2?.error) console.error('[refuser] demande update error:', r2.error)

  // Email de courtoisie
  if (demande?.email) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const prenom = (demande.nom_prospect ?? 'Client').split(' ')[0]

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

  return NextResponse.redirect(`${SITE_URL}/devis/refuse`)
}
