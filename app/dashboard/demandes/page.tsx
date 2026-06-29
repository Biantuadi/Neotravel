import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import DemandesTable, { type Demande } from './DemandesTable'

export const metadata: Metadata = { title: 'NeoTravel — Demandes' }
export const revalidate = 30

// ── KPI ──────────────────────────────────────────────────

function KpiCard({ label, value, note, noteColor }: {
  label: string; value: string; note: string; noteColor: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-5 py-4 flex flex-col gap-1">
      <p className="text-[11px] text-[#707a8c]">{label}</p>
      <p className="text-[32px] font-extrabold text-[#12151a] leading-none py-1">{value}</p>
      <p className={`text-[11px] font-medium ${noteColor}`}>{note}</p>
    </div>
  )
}

// ── Données ───────────────────────────────────────────────

async function getDemandesData() {
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Seuls les cas transférés à l'équipe humaine (escalader_humain)
  const STATUTS_EQUIPE = ['cas_complexe', 'qualifie', 'incomplet', 'cloture']

  const [
    { count: total },
    { count: nouvelles },
    { count: urgentes },
    { count: enCours },
    { count: traitees },
    { data: demandes },
  ] = await Promise.all([
    // Total transférés ce mois
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .in('statut', STATUTS_EQUIPE)
      .gte('date_creation', startOfMonth.toISOString()),

    // Nouvelles aujourd'hui (cas_complexe non encore traités)
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'cas_complexe')
      .gte('date_creation', startOfDay.toISOString()),

    // Urgentes en attente
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .in('statut', STATUTS_EQUIPE)
      .eq('urgence', 'urgente')
      .not('statut', 'in', '("cloture")'),

    // En cours de traitement (qualifié)
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'qualifie'),

    // Clôturées (ce mois)
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'cloture')
      .gte('date_creation', startOfMonth.toISOString()),

    // Liste — uniquement les cas transférés à l'équipe
    supabaseAdmin.from('demandes')
      .select('id,nom_prospect,email,telephone,depart,destination,date_depart,nb_passagers,urgence,statut,date_creation,note_commerciale')
      .in('statut', STATUTS_EQUIPE)
      .order('date_creation', { ascending: false })
      .limit(200),
  ])

  return {
    total: total ?? 0,
    nouvelles: nouvelles ?? 0,
    urgentes: urgentes ?? 0,
    enCours: enCours ?? 0,
    traitees: traitees ?? 0,
    demandes: (demandes ?? []) as Demande[],
  }
}

// ── Page ─────────────────────────────────────────────────

export default async function DemandesPage() {
  const d = await getDemandesData()

  return (
    <>
      <h1 className="text-2xl lg:text-[26px] font-extrabold text-[#12151a]">Demandes transférées</h1>
      <p className="text-[13px] text-[#707a8c] mt-1 mb-6">Cas complexes transmis à l'équipe par l'IA</p>

      {/* KPIs : 2 cols mobile → 3 md → 5 xl */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Transférées ce mois"
          value={d.total.toLocaleString('fr-FR')}
          note="cas complexes"
          noteColor="text-[#707a8c]"
        />
        <KpiCard
          label="Nouvelles aujourd'hui"
          value={String(d.nouvelles)}
          note={d.nouvelles > 0 ? '↑ à traiter' : 'aucune'}
          noteColor={d.nouvelles > 0 ? 'text-[#f29c12]' : 'text-[#21a666]'}
        />
        <KpiCard
          label="Urgentes"
          value={String(d.urgentes)}
          note={d.urgentes > 0 ? '⚠ prioritaire' : 'aucune'}
          noteColor={d.urgentes > 0 ? 'text-[#e53935]' : 'text-[#21a666]'}
        />
        <KpiCard
          label="En cours"
          value={String(d.enCours)}
          note="qualifiées"
          noteColor="text-[#4caf50]"
        />
        <KpiCard
          label="Clôturées"
          value={d.traitees.toLocaleString('fr-FR')}
          note="ce mois"
          noteColor="text-[#4caf50]"
        />
      </div>

      {/* Table avec filtres */}
      <DemandesTable demandes={d.demandes} />
    </>
  )
}
