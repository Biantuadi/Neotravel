import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import RelancesTable, { type RelanceRow } from './RelancesTable'

export const metadata: Metadata = { title: 'NeoTravel — Relances' }
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

async function getRelancesData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    { count: envoyees },
    { count: enAttente },
    sansReponseResult,
    reponduesResult,
    { data: relances },
  ] = await Promise.all([
    // Envoyées ce mois
    supabaseAdmin.from('relances').select('*', { count: 'exact', head: true })
      .eq('statut', 'envoyee')
      .gte('created_at', startOfMonth.toISOString()),

    // En attente (programmée, date future)
    supabaseAdmin.from('relances').select('*', { count: 'exact', head: true })
      .eq('statut', 'programmee')
      .gte('date_programmee', now.toISOString()),

    // Sans réponse : envoyées mais demande toujours en relance_1 ou relance_2
    supabaseAdmin.from('relances')
      .select('id, demandes(statut)')
      .eq('statut', 'envoyee'),

    // Répondues : envoyées dont la demande est accepte ou refuse
    supabaseAdmin.from('relances')
      .select('id, demandes(statut)')
      .eq('statut', 'envoyee'),

    // Liste pour la table
    supabaseAdmin.from('relances')
      .select(`
        id, type, date_programmee, statut, created_at,
        demandes ( nom_prospect, statut )
      `)
      .order('date_programmee', { ascending: false })
      .limit(200),
  ])

  // Calcul manuel depuis les données
  const allEnvoyees = sansReponseResult.data ?? []
  const repondues = allEnvoyees.filter(r => {
    const dem = r.demandes as unknown as { statut: string } | null
    return dem?.statut === 'accepte' || dem?.statut === 'refuse'
  }).length
  const sansReponse = allEnvoyees.filter(r => {
    const dem = r.demandes as unknown as { statut: string } | null
    return dem?.statut === 'relance_1' || dem?.statut === 'relance_2' || dem?.statut === 'devis_envoye'
  }).length

  const totalEnv = envoyees ?? 0
  const tauxReponse = totalEnv > 0 ? Math.round((repondues / totalEnv) * 100) : 0

  return {
    envoyees: totalEnv,
    enAttente: enAttente ?? 0,
    sansReponse,
    repondues,
    tauxReponse,
    relances: (relances ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      demande: r.demandes ?? null,
    })) as unknown as RelanceRow[],
  }
}

// ── Page ─────────────────────────────────────────────────

export default async function RelancesPage() {
  const d = await getRelancesData()

  return (
    <>
      <h1 className="text-2xl lg:text-[26px] font-extrabold text-[#12151a]">Relances</h1>
      <p className="text-[13px] text-[#707a8c] mt-1 mb-6">Suivi des séquences de relance automatiques</p>

      {/* KPIs : 2 cols mobile → 5 xl */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Relances envoyées"
          value={String(d.envoyees)}
          note="ce mois"
          noteColor="text-[#336bc7]"
        />
        <KpiCard
          label="En attente"
          value={String(d.enAttente)}
          note={d.enAttente > 0 ? 'à envoyer' : 'aucune'}
          noteColor={d.enAttente > 0 ? 'text-[#f29c12]' : 'text-[#21a666]'}
        />
        <KpiCard
          label="Sans réponse"
          value={String(d.sansReponse)}
          note={d.sansReponse > 0 ? 'à surveiller' : 'aucune'}
          noteColor={d.sansReponse > 0 ? 'text-[#e53935]' : 'text-[#21a666]'}
        />
        <KpiCard
          label="Répondues"
          value={String(d.repondues)}
          note={`taux ${d.tauxReponse}%`}
          noteColor="text-[#4caf50]"
        />
        <KpiCard
          label="Taux de réponse"
          value={`${d.tauxReponse}%`}
          note={d.tauxReponse >= 60 ? '↑ bon' : 'à améliorer'}
          noteColor={d.tauxReponse >= 60 ? 'text-[#4caf50]' : 'text-[#ed8f1a]'}
        />
      </div>

      {/* Table */}
      <RelancesTable relances={d.relances} />
    </>
  )
}
