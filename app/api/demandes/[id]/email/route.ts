import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

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
    return NextResponse.json({ error: 'Pas d\'email pour ce prospect' }, { status: 400 })
  }

  const nom = demande.nom_prospect ?? 'Prospect'
  const trajet = demande.depart && demande.destination
    ? `${demande.depart} → ${demande.destination}`
    : 'trajet en cours de définition'
  const date = demande.date_depart
    ? new Date(demande.date_depart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'à définir'

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: demande.email,
    subject: 'Votre demande NeoTravel — Suivi de dossier',
    html: `
      <p>Bonjour ${nom},</p>
      <p>Notre équipe commerciale a bien pris en charge votre demande de transport de groupe :</p>
      <ul>
        <li><strong>Trajet :</strong> ${trajet}</li>
        <li><strong>Date :</strong> ${date}</li>
        <li><strong>Passagers :</strong> ${demande.nb_passagers ?? '—'}</li>
      </ul>
      <p>Un conseiller vous contactera prochainement pour finaliser votre devis.</p>
      <p>Bien cordialement,<br />L'équipe NeoTravel</p>
    `,
  })

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  await supabaseAdmin.from('logs').insert({
    demande_id: id,
    type_log: 'email_manuel',
    message: `Email de suivi envoyé manuellement à ${demande.email}`,
  })

  return NextResponse.json({ ok: true })
}
