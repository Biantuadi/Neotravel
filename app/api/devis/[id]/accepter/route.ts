import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDevisToken } from '@/lib/devis-token'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neotravel.fr'

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

  if (devis.statut === 'accepte') {
    return NextResponse.redirect(`${SITE_URL}/devis/confirme?already=1`)
  }

  if (devis.statut === 'expire' || devis.statut === 'refuse') {
    return NextResponse.redirect(`${SITE_URL}/devis/expire`)
  }

  await Promise.all([
    supabaseAdmin
      .from('devis')
      .update({ statut: 'accepte' })
      .eq('id', id),

    devis.demande_id
      ? supabaseAdmin
          .from('demandes')
          .update({ statut: 'accepte', updated_at: new Date().toISOString() })
          .eq('id', devis.demande_id)
      : Promise.resolve(),

    supabaseAdmin.from('logs').insert({
      demande_id:    devis.demande_id,
      action:        'devis_accepte_via_email',
      outil_utilise: 'lien_email',
    }),
  ])

  return NextResponse.redirect(`${SITE_URL}/devis/confirme`)
}
