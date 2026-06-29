import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import DevisTable, { type DevisRow } from './DevisTable'

export const metadata: Metadata = { title: 'NeoTravel — Devis' }
export const revalidate = 30

// ── KPI ──────────────────────────────────────────────────

function KpiCard({ label, value, note, noteColor }: {
  label: string; value: string; note: string; noteColor: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-5 py-4 flex flex-col gap-1">
      <p className="text-[11px] text-[#707a8c]">{label}</p>
      <p className="text-[32px] font-extrabold text-[#12151a] leading-none py-1 truncate">{value}</p>
      <p className={`text-[11px] font-medium ${noteColor}`}>{note}</p>
    </div>
  )
}

// ── Données ───────────────────────────────────────────────

async function getDevisData() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { count: total },
    { count: envoyes },
    { count: signes },
    { count: enAttente },
    { count: refuses },
    montantResult,
    { data: devis },
  ] = await Promise.all([
    // Total ce mois
    supabaseAdmin.from('devis').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString()),

    // Envoyés (en attente de réponse = envoye seulement)
    supabaseAdmin.from('devis').select('*', { count: 'exact', head: true })
      .eq('statut', 'envoye'),

    // Signés
    supabaseAdmin.from('devis').select('*', { count: 'exact', head: true })
      .eq('statut', 'accepte'),

    // En attente (envoye + expire non relancé)
    supabaseAdmin.from('devis').select('*', { count: 'exact', head: true })
      .in('statut', ['envoye', 'expire']),

    // Refusés
    supabaseAdmin.from('devis').select('*', { count: 'exact', head: true })
      .eq('statut', 'refuse'),

    // Montant total signé ce mois
    supabaseAdmin.from('devis')
      .select('prix_ttc')
      .eq('statut', 'accepte')
      .gte('created_at', startOfMonth.toISOString()),

    // Liste pour la table avec join demande
    supabaseAdmin.from('devis')
      .select(`
        id, prix_ttc, envoye_le, statut, pdf_url, created_at, demande_id,
        demandes ( nom_prospect, depart, destination )
      `)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const montantTotal = (montantResult.data ?? []).reduce((s, r) => s + (r.prix_ttc ?? 0), 0)
  const totalVal = total ?? 0
  const signesVal = signes ?? 0
  const tauxConversion = totalVal > 0 ? Math.round((signesVal / totalVal) * 100) : 0
  const panierMoyen = signesVal > 0 ? Math.round(montantTotal / signesVal) : 0

  return {
    total: totalVal,
    envoyes: envoyes ?? 0,
    signes: signesVal,
    enAttente: enAttente ?? 0,
    refuses: refuses ?? 0,
    tauxConversion,
    montantTotal,
    panierMoyen,
    devis: (devis ?? []).map((d: Record<string, unknown>) => ({
      ...d,
      demande: d.demandes ?? null,
    })) as unknown as DevisRow[],
  }
}

function fmtEur(n: number) {
  if (n >= 1000) return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
  return n + ' €'
}

// ── Page ─────────────────────────────────────────────────

export default async function DevisPage() {
  const d = await getDevisData()

  return (
    <>
      <h1 className="text-2xl lg:text-[26px] font-extrabold text-[#12151a]">Devis</h1>
      <p className="text-[13px] text-[#707a8c] mt-1 mb-6">Suivi de tous les devis générés et envoyés</p>

      {/* KPI ligne 1 : 2 cols mobile → 5 xl */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <KpiCard
          label="Total devis"
          value={d.total.toLocaleString('fr-FR')}
          note="ce mois"
          noteColor="text-[#707a8c]"
        />
        <KpiCard
          label="Envoyés"
          value={String(d.envoyes)}
          note="en attente réponse"
          noteColor="text-[#336bc7]"
        />
        <KpiCard
          label="Signés"
          value={String(d.signes)}
          note={`${d.tauxConversion}% conversion`}
          noteColor="text-[#4caf50]"
        />
        <KpiCard
          label="En attente"
          value={String(d.enAttente)}
          note={d.enAttente > 0 ? 'à relancer' : 'aucun'}
          noteColor={d.enAttente > 0 ? 'text-[#f29c12]' : 'text-[#21a666]'}
        />
        <KpiCard
          label="Refusés"
          value={String(d.refuses)}
          note="↓ ce mois"
          noteColor="text-[#e53935]"
        />
      </div>

      {/* KPI ligne 2 : 1 col mobile → 3 lg */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Taux de conversion"
          value={`${d.tauxConversion}%`}
          note={d.tauxConversion >= 25 ? '↑ bon' : 'à améliorer'}
          noteColor={d.tauxConversion >= 25 ? 'text-[#4caf50]' : 'text-[#ed8f1a]'}
        />
        <KpiCard
          label="Montant total généré"
          value={fmtEur(d.montantTotal)}
          note="ce mois"
          noteColor="text-[#4caf50]"
        />
        <KpiCard
          label="Panier moyen"
          value={d.panierMoyen > 0 ? fmtEur(d.panierMoyen) : '—'}
          note="par devis signé"
          noteColor="text-[#707a8c]"
        />
      </div>

      {/* Table avec filtres */}
      <DevisTable devis={d.devis} />
    </>
  )
}
