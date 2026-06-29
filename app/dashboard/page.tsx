import type { Metadata } from 'next'
import { getDashboardData } from '@/lib/dashboard-data'

export const metadata: Metadata = { title: 'NeoTravel — Tableau de bord' }
export const revalidate = 60 // rafraîchit toutes les 60s

// ── Composants UI ────────────────────────────────────────

function KpiCard({ label, value, note, noteColor }: {
  label: string; value: string; note: string; noteColor: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.09)] px-5 py-4 flex flex-col gap-1">
      <p className="text-[11px] text-[#707a8c]">{label}</p>
      <p className="text-4xl font-extrabold text-[#14141a] leading-none py-1">{value}</p>
      <p className={`text-[11px] font-medium ${noteColor}`}>{note}</p>
    </div>
  )
}

function BarRow({ label, pct, value, valueColor, barColor = '#4caf50' }: {
  label: string; pct: number; value: string; valueColor: string; barColor?: string
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[11px] text-[#707a8c] mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 h-[14px] bg-[#e0e2e6] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
        </div>
        <span className={`text-[12px] font-bold whitespace-nowrap ${valueColor}`}>{value}</span>
      </div>
    </div>
  )
}

function DonutChart({ pct, color, label = '' }: { pct: number; color: string; label?: string }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative w-[116px] h-[116px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e0e2e6" strokeWidth="12" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-bold" style={{ color }}>{pct}%</span>
        {label && <span className="text-[9px] text-[#707a8c]">{label}</span>}
      </div>
    </div>
  )
}

function StatBox({ value, valueColor, label, topColor }: {
  value: string; valueColor: string; label: string; topColor: string
}) {
  return (
    <div className="bg-[#f5f7fa] rounded-xl overflow-hidden flex-1 min-w-0">
      <div className="h-1 w-full" style={{ backgroundColor: topColor }} />
      <div className="px-3 py-3">
        <p className="text-[28px] font-extrabold leading-none mb-1" style={{ color: valueColor }}>{value}</p>
        <p className="text-[10px] text-[#707a8c]">{label}</p>
      </div>
    </div>
  )
}

function Legend({ color, label, bold = false }: { color: string; label: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className={`text-[11px] ${bold ? 'font-medium text-[#14141a]' : 'text-[#707a8c]'}`}>{label}</span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default async function DashboardPage() {
  const d = await getDashboardData()

  const pipelineMax = Math.max(d.devisEnvoyes, 1)

  return (
    <>
        <h1 className="text-2xl lg:text-[26px] font-extrabold text-[#14141a]">Tableau de bord commercial</h1>
        <p className="text-[13px] text-[#707a8c] mt-1 mb-6">Vue direction — mise à jour en temps réel</p>

        {/* KPIs : 2 cols mobile → 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="Leads reçus / jour"
            value={String(d.leadsAujourdhui)}
            note={d.leadsAujourdhui > 0 ? "aujourd'hui" : 'aucun aujourd\'hui'}
            noteColor="text-[#21a666]"
          />
          <KpiCard
            label="Taux de conversion"
            value={`${d.tauxConversion}%`}
            note={d.tauxConversion >= 25 ? '+5 pts' : 'à améliorer'}
            noteColor={d.tauxConversion >= 25 ? 'text-[#21a666]' : 'text-[#ed8f1a]'}
          />
          <KpiCard
            label="Devis envoyés"
            value={String(d.devisEnvoyes)}
            note={`${d.devisAcceptes} acceptés`}
            noteColor="text-[#21a666]"
          />
          <KpiCard
            label="Relances en attente"
            value={String(d.relancesAttente)}
            note={d.relancesAttente > 0 ? 'à traiter' : 'à jour'}
            noteColor={d.relancesAttente > 5 ? 'text-[#f29c12]' : 'text-[#21a666]'}
          />
        </div>

        {/* Pipeline + Demandes urgentes */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-4 mb-4">

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
            <p className="text-[16px] font-bold text-[#14141a] mb-5">Pipeline des devis</p>
            <BarRow label="Envoyés"  pct={100} value={String(d.devisEnvoyes)} barColor="#336bc7" valueColor="text-[#174f9e]" />
            <BarRow label="Acceptés" pct={pipelineMax > 0 ? (d.devisAcceptes / pipelineMax) * 100 : 0} value={String(d.devisAcceptes)} barColor="#4caf50" valueColor="text-[#17995c]" />
            <BarRow label="Refusés"  pct={pipelineMax > 0 ? (d.devisRefuses / pipelineMax) * 100 : 0} value={String(d.devisRefuses)} barColor="#e53935" valueColor="text-[#d11a2e]" />
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
            <p className="text-[14px] font-bold text-[#122147] mb-4">Demandes urgentes</p>
            <div className="flex gap-4 items-start">
              <div className="flex-1 min-w-0 space-y-2">
                <Legend color="#4caf50" label={`Traitées avant J+2 : ${d.urgentesTraitees}%`} bold />
                <Legend color="#f29c12" label={`En attente : ${d.urgentesEnAttente}%`} />
                <Legend color="#e0e2e6" label={`Volume : ~${d.urgentesParJour} urgence${d.urgentesParJour > 1 ? 's' : ''} / jour`} />
                <p className="text-[11px] font-medium text-[#f29c12] pt-4">
                  {d.urgentesEnAttente}% des urgences encore en attente de traitement
                </p>
              </div>
              <DonutChart pct={d.urgentesTraitees} color="#4caf50" />
            </div>
          </div>
        </div>

        {/* 3 donuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5">
            <p className="text-[13px] font-bold text-[#122147] mb-4">Devis complétés sans relance</p>
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0 space-y-2">
                <Legend color="#4caf50" label={`Acceptés direct : ${Math.min(d.tauxAutomatisation, 100)}%`} bold />
                <Legend color="#f29c12" label={`Après relance : ${100 - Math.min(d.tauxAutomatisation, 100)}%`} />
                <p className="text-[11px] font-medium text-[#17995c] pt-4">
                  ↑ taux auto. : {d.tauxAutomatisation}%
                </p>
              </div>
              <DonutChart pct={Math.min(d.tauxAutomatisation, 100)} color="#4caf50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5">
            <p className="text-[13px] font-bold text-[#122147] mb-4">{"Taux d'automatisation des dossiers"}</p>
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0 space-y-2">
                <Legend color="#4caf50" label={`Traités par l'agent IA : ${d.tauxAutomatisation}%`} bold />
                <Legend color="#e0e2e6" label={`Reprise humaine : ${d.tauxHumain}%`} />
                <p className="text-[11px] font-medium text-[#ed8f1a] pt-4">Objectif phase 3 : {`>`} 80%</p>
              </div>
              <DonutChart pct={d.tauxAutomatisation} color="#4caf50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5">
            <p className="text-[13px] font-bold text-[#122147] mb-4">{"Détail de l'intervention humaine"}</p>
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0 space-y-2 mt-4">
                <Legend color="#e53935" label={`HITL haute valeur (> 5 000 €) : ${d.tauxHitlHauteValeur}%`} />
                <p className="text-[11px] font-medium text-[#d11a2e] pt-4">
                  {d.dossiersEnAttenteCommercial} dossier{d.dossiersEnAttenteCommercial !== 1 ? 's' : ''} en attente commercial
                </p>
              </div>
              <div className="relative w-[116px] h-[116px] shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#e0e2e6" strokeWidth="12" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#f29c12" strokeWidth="12"
                    strokeDasharray={`${(d.tauxHumain / 100) * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
                    strokeLinecap="round" />
                  {d.tauxHitlHauteValeur > 0 && (
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#e53935" strokeWidth="12"
                      strokeDasharray={`${(d.tauxHitlHauteValeur / 100) * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
                      strokeDashoffset={`-${(d.tauxHumain / 100) * 2 * Math.PI * 44}`}
                      strokeLinecap="round" />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[15px] font-bold text-[#f29c12]">{d.tauxHumain}%</span>
                  <span className="text-[9px] text-[#707a8c]">humain</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Temps gagné + Relances */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
            <p className="text-[14px] font-bold text-[#122147] mb-5">Temps gagné par les commerciaux / semaine</p>
            {d.tempsSemaine.map(({ label, heures, max }, i) => {
              const valueColors = ['text-[#174f9e]', 'text-[#174f9e]', 'text-[#17995c]', 'text-[#ed8f1a]']
              return (
                <BarRow key={label} label={label} pct={(heures / max) * 100}
                  value={`${heures}h/sem`} barColor="#4caf50" valueColor={valueColors[i]} />
              )
            })}
            <p className="text-[11px] font-medium text-[#17995c] mt-3">
              Total : ~{d.tempsSemaine.reduce((s, t) => s + t.heures, 0)}h/semaine récupérées par les commerciaux
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6">
            <p className="text-[14px] font-bold text-[#122147] mb-5">Relances — Indicateurs</p>
            <div className="flex gap-3 mb-5">
              <StatBox value={String(d.relancesEnvoyees)} valueColor="#174f9e" label="Envoyées"          topColor="#336bc7" />
              <StatBox value={String(d.relancesEnRetard)} valueColor="#d11a2e" label="En retard"         topColor="#e53935" />
              <StatBox value={String(d.relancesReponses)} valueColor="#17995c" label="Réponses obtenues" topColor="#4caf50" />
            </div>
            <p className="text-[12px] font-medium text-[#122147] mb-2">Taux de réponse aux relances</p>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 min-w-0 h-3 bg-[#e0e2e6] rounded-full overflow-hidden">
                <div className="h-full bg-[#f29c12] rounded-full" style={{ width: `${d.tauxReponseRelances}%` }} />
              </div>
              <span className="text-[11px] font-bold text-[#17995c] whitespace-nowrap">{d.tauxReponseRelances}%</span>
            </div>
            {d.relancesEnRetard > 0 && (
              <p className="text-[11px] font-medium text-[#e53935] mt-4">
                ⚠ {d.relancesEnRetard} relance{d.relancesEnRetard > 1 ? 's' : ''} en retard — action requise
              </p>
            )}
          </div>
        </div>
    </>
  )
}
