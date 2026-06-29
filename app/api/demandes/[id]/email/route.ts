import { supabaseAdmin } from '@/lib/supabase'
import { emailGenerique, emailInfosManquantes } from '@/lib/email-templates'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const isTestMode = fromEmail.includes('resend.dev')
const testRedirectTo = process.env.RESEND_TEST_EMAIL ?? 'biantuadikevin@gmail.com'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: demande, error } = await supabaseAdmin
    .from('demandes')
    .select('nom_prospect, email, depart, destination, date_depart, nb_passagers')
    .eq('id', id)
    .single()

  if (error || !demande) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }

  if (!demande.email) {
    return NextResponse.json({ error: "Pas d'email pour ce prospect" }, { status: 400 })
  }

  const body = await _req.json().catch(() => ({}))
  const contenu: string | undefined = body.contenu
  const template: string = body.template ?? 'generique'

  if (!contenu?.trim() && template === 'generique') {
    return NextResponse.json({ error: 'Le contenu du message est requis.' }, { status: 400 })
  }

  const prenom = (demande.nom_prospect ?? 'Prospect').split(' ')[0]
  const toEmail = isTestMode ? testRedirectTo : demande.email
  const subjectBase = body.subject?.trim() || 'Votre demande NeoTravel — Suivi de dossier'

  let html: string

  if (template === 'infos_manquantes') {
    const dateDepart = demande.date_depart
      ? new Date(demande.date_depart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'à définir'
    const champsManquants: string[] = body.champsManquants ?? []
    html = emailInfosManquantes({
      prenom,
      depart: demande.depart ?? '—',
      destination: demande.destination ?? '—',
      dateDepart,
      champsManquants: champsManquants.length > 0 ? champsManquants : ['Informations complémentaires requises'],
      ctaUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neotravel-six.vercel.app',
    })
  } else {
    html = emailGenerique({ prenom, contenu: contenu ?? '' })
  }

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: isTestMode ? `[TEST → ${demande.email}] ${subjectBase}` : subjectBase,
    html,
  })

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  await supabaseAdmin.from('logs').insert({
    demande_id: id,
    action: 'email_manuel',
    outil_utilise: 'backoffice',
  })

  return NextResponse.json({ ok: true })
}
