import type { Metadata } from 'next'
import { getDashboardData } from '@/lib/dashboard-data'

export const metadata: Metadata = { title: 'NeoTravel — Tableau de bord' }
export const revalidate = 60

// ── Helpers ──────────────────────────────────────────────

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  nouveau_lead:  { label: 'Nouveau',       color: '#707a8c', bg: 'bg-[rgba(112,122,140,0.1)]' },
  incomplet:     { label: 'Incomplet',     color: '#f29c12', bg: 'bg-[rgba(242,156,18,0.1)]' },
  qualifie:      { label: 'Qualifié',      color: '#336bc7', bg: 'bg-[rgba(51,107,199,0.1)]' },
  devis_envoye:  { label: 'Devis envoyé',  color: '#7c3aed', bg: 'bg-[rgba(124,58,237,0.1)]' },
  relance_1:     { label: 'Relance 1',     color: '#f29c12', bg: 'bg-[rgba(242,156,18,0.1)]' },
  relance_2:     { label: 'Relance 2',     color: '#ed6a1a', bg: 'bg-[rgba(237,106,26,0.1)]' },
  accepte:       { label: 'Accepté',       color: '#21a666', bg: 'bg-[rgba(33,166,102,0.1)]' },
  refuse:        { label: 'Refusé',        color: '#e53935', bg: 'bg-[rgba(229,57,53,0.1)]' },
  cas_complexe:  { label: 'Cas complexe',  color: '#e53935', bg: 'bg-[rgba(229,57,53,0.1)]' },
  cloture:       { label: 'Clôturé',       color: '#9ca3af', bg: 'bg-[rgba(156,163,175,0.1)]' },
}

const URGENCE_LABELS: Record<string, { label: string; dot: string }> = {
  faible:  { label: 'Faible',  dot: 'bg-[#9ca3af]' },
  normale: { label: 'Normale', dot: 'bg-[#f29c12]' },
  urgente: { label: 'Urgente', dot: 'bg-[#e53935]' },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Sous-composants ───────────────────────────────────────

function KpiCard({ label, value, sub, subGreen = false }: {
  label: string; value: string; sub: string; subGreen?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8eaed] px-5 py-4 flex flex-col gap-1.5">
      <p className="text-[11px] text-[#9ca3af] font-medium uppercase tracking-wider">{label}</p>
      <p className="text-[32px] font-extrabold text-[#12151a] leading-none">{value}</p>
      <p className={`text-[11px] font-medium ${subGreen ? 'text-[#21a666]' : 'text-[#9ca3af]'}`}>{sub}</p>
    </div>
  )
}

function BarRow({ label, value, pct, color }: {
  label: string; value: number | string; pct: number; color: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[12px] text-[#4b5563]">{label}</span>
        <span className="text-[12px] font-bold text-[#12151a]">{value}</span>
      </div>
      <div className="h-2 bg-[#f1f3f6] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function Badge({ statut }: { statut: string }) {
  const cfg = STATUT_LABELS[statut] ?? { label: statut, color: '#707a8c', bg: 'bg-[rgba(112,122,140,0.1)]' }
  return (
    <span className={`inline-flex items-center px-2.5 h-[22px] rounded-full text-[11px] font-medium ${cfg.bg}`}
      style={{ color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────

export default async function DashboardPage() {
  const d = await getDashboardData()

  const pipeMax = Math.max(d.devisEnvoyes, 1)
  const totalStatuts = Object.values(d.statutCounts).reduce((s, n) => s + n, 0)

  return (
    <div className="space-y-5 pb-10">

      {/* Header */}
      <div className="pt-1">
        <h1 className="text-[22px] lg:text-[26px] font-extrabold text-[#12151a]">Tableau de bord</h1>
        <p className="text-[13px] text-[#9ca3af] mt-0.5">Vue commerciale — données en temps réel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Leads aujourd'hui"
          value={String(d.leadsAujourdhui)}
          sub={d.leadsAujourdhui > 0 ? `${d.totalDemandes} au total` : 'aucun ce jour'}
        />
        <KpiCard
          label="Taux de conversion"
          value={`${d.tauxConversion}%`}
          sub={d.tauxConversion > 0
            ? `${d.devisAcceptes} dossier${d.devisAcceptes > 1 ? 's' : ''} accepté${d.devisAcceptes > 1 ? 's' : ''}`
            : 'aucun accepté'}
          subGreen={d.tauxConversion > 0}
        />
        <KpiCard
          label="Devis envoyés"
          value={String(d.devisEnvoyes)}
          sub={`${d.devisAcceptes} accepté · ${d.devisRefuses} refusé`}
          subGreen={d.devisAcceptes > 0}
        />
        <KpiCard
          label="Relances en attente"
          value={String(d.relancesAttente)}
          sub={d.relancesEnRetard > 0 ? `${d.relancesEnRetard} en retard` : 'à jour'}
          subGreen={d.relancesEnRetard === 0}
        />
      </div>

      {/* Pipeline + Répartition statuts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Pipeline */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <p className="text-[14px] font-bold text-[#12151a] mb-4">Pipeline des devis</p>
          <div className="space-y-4">
            <BarRow label="Envoyés"  value={d.devisEnvoyes}  pct={100} color="#336bc7" />
            <BarRow label="Acceptés" value={d.devisAcceptes} pct={pipeMax > 0 ? (d.devisAcceptes / pipeMax) * 100 : 0} color="#21a666" />
            <BarRow label="Refusés"  value={d.devisRefuses}  pct={pipeMax > 0 ? (d.devisRefuses / pipeMax) * 100 : 0}  color="#e53935" />
          </div>
          {d.devisEnvoyes > 0 && (
            <p className="text-[11px] text-[#9ca3af] mt-4 pt-3 border-t border-[#f1f3f6]">
              Taux d&apos;acceptation : <span className="font-semibold text-[#21a666]">{Math.round((d.devisAcceptes / d.devisEnvoyes) * 100)}%</span>
            </p>
          )}
        </div>

        {/* Répartition statuts */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <p className="text-[14px] font-bold text-[#12151a] mb-4">Répartition des dossiers</p>
          {totalStatuts === 0 ? (
            <div className="flex items-center justify-center h-24 text-[13px] text-[#9ca3af]">
              Aucun dossier pour l&apos;instant
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(d.statutCounts)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([statut, count]) => {
                  const cfg = STATUT_LABELS[statut]
                  return (
                    <div key={statut} className={`flex items-center justify-between px-3 py-2 rounded-xl ${cfg?.bg ?? 'bg-[#f5f7fa]'}`}>
                      <span className="text-[12px]" style={{ color: cfg?.color ?? '#707a8c' }}>{cfg?.label ?? statut}</span>
                      <span className="text-[13px] font-bold" style={{ color: cfg?.color ?? '#707a8c' }}>{count}</span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Relances + Dernières demandes */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">

        {/* Relances */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <p className="text-[14px] font-bold text-[#12151a] mb-4">Relances</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { v: d.relancesEnvoyees, label: 'Envoyées',  color: '#336bc7' },
              { v: d.relancesEnRetard, label: 'En retard', color: '#e53935' },
              { v: d.relancesReponses, label: 'Réponses',  color: '#21a666' },
            ].map(({ v, label, color }) => (
              <div key={label} className="bg-[#f5f7fa] rounded-xl p-3 text-center">
                <p className="text-[22px] font-extrabold leading-none mb-1" style={{ color }}>{v}</p>
                <p className="text-[10px] text-[#9ca3af]">{label}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[12px] text-[#4b5563]">Taux de réponse</span>
              <span className="text-[12px] font-bold text-[#12151a]">{d.tauxReponseRelances}%</span>
            </div>
            <div className="h-2 bg-[#f1f3f6] rounded-full overflow-hidden">
              <div className="h-full bg-[#21a666] rounded-full" style={{ width: `${d.tauxReponseRelances}%` }} />
            </div>
          </div>
          {d.relancesEnRetard > 0 && (
            <p className="text-[11px] text-[#e53935] font-medium mt-3 pt-3 border-t border-[#f1f3f6]">
              {d.relancesEnRetard} relance{d.relancesEnRetard > 1 ? 's' : ''} dépassée{d.relancesEnRetard > 1 ? 's' : ''} — à traiter
            </p>
          )}
          <div className="mt-4 pt-3 border-t border-[#f1f3f6]">
            <div className="flex justify-between text-[12px]">
              <span className="text-[#9ca3af]">Automatisation</span>
              <span className="font-semibold text-[#12151a]">{d.tauxAutomatisation}% via l&apos;IA</span>
            </div>
            {d.dossiersEscalades > 0 && (
              <div className="flex justify-between text-[12px] mt-1">
                <span className="text-[#9ca3af]">Escalades humain</span>
                <span className="font-semibold text-[#e53935]">{d.dossiersEscalades}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dernières demandes */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <p className="text-[14px] font-bold text-[#12151a] mb-4">Dernières demandes</p>
          {d.recentDemandes.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-[13px] text-[#9ca3af]">
              Aucune demande reçue pour l&apos;instant
            </div>
          ) : (
            <div className="space-y-2">
              {d.recentDemandes.map((dem) => {
                const urg = URGENCE_LABELS[dem.urgence] ?? URGENCE_LABELS['normale']
                return (
                  <div key={dem.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-[#f9fafb] hover:bg-[#f1f3f6] transition-colors">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${urg.dot}`} title={urg.label} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#12151a] truncate">{dem.nom_prospect}</p>
                      <p className="text-[11px] text-[#9ca3af] truncate">
                        {dem.depart && dem.destination
                          ? `${dem.depart} → ${dem.destination}`
                          : dem.depart ?? dem.destination ?? 'Trajet non précisé'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge statut={dem.statut} />
                      <span className="text-[11px] text-[#9ca3af] hidden sm:block">{fmt(dem.date_creation)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
