import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const STATUTS_VALIDES = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'] as const
type Statut = typeof STATUTS_VALIDES[number]

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
    .select('id, demande_id, statut')
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

  // Synchro statut demande associée si signé ou refusé
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

  return NextResponse.json({ ok: true })
}
