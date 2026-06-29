import { supabaseAdmin } from '@/lib/supabase'
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
    return NextResponse.json({ error: 'Pas d\'email pour ce prospect' }, { status: 400 })
  }

  const body = await _req.json().catch(() => ({}))
  const contenu: string | undefined = body.contenu

  if (!contenu?.trim()) {
    return NextResponse.json({ error: 'Le contenu du message est requis.' }, { status: 400 })
  }

  const nom = demande.nom_prospect ?? 'Prospect'
  const toEmail = isTestMode ? testRedirectTo : demande.email
  const subjectBase = body.subject?.trim() || 'Votre demande NeoTravel — Suivi de dossier'

  const htmlContenu = contenu
    .trim()
    .split('\n')
    .map((line: string) => line.trim() ? `<p style="margin:0 0 12px">${line}</p>` : '<br/>')
    .join('')

  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: isTestMode ? `[TEST → ${demande.email}] ${subjectBase}` : subjectBase,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
        <p style="margin:0 0 12px">Bonjour ${nom},</p>
        ${htmlContenu}
        <p style="margin:24px 0 0;color:#64748b;font-size:13px">— L'équipe NeoTravel</p>
      </div>
    `,
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
