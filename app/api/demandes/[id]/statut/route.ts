import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const STATUTS_VALIDES = [
  'nouveau_lead', 'incomplet', 'qualifie', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { statut, note } = await req.json()

  if (!STATUTS_VALIDES.includes(statut)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('demandes')
    .update({ statut, ...(note !== undefined ? { note_commerciale: note } : {}) })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('logs').insert({
    demande_id: id,
    action: `statut_change:${statut}`,
    outil_utilise: 'backoffice',
  })

  return NextResponse.json({ ok: true })
}
