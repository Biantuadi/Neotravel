import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'NeoTravel — Tableau de bord' }

// ── Composants utilitaires ────────────────────────────────

function KpiCard({ label, value, note, noteColor }: {
  label: string; value: string; note: string; noteColor: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.09)] px-5 py-4 flex-1 min-w-0">
      <p className="text-[11px] text-[#707a8c] mb-1">{label}</p>
      <p className="text-[36px] font-extrabold text-[#14141a] leading-none mb-2">{value}</p>
      <p className={`text-[11px] font-medium ${noteColor}`}>{note}</p>
    </div>
  )
}

function BarRow({ label, widthPx, maxPx, value, valueColor }: {
  label: string; widthPx: number; maxPx: number; value: string; valueColor: string
}) {
  const pct = Math.round((widthPx / maxPx) * 100)
  return (
    <div className="mb-4">
      <p className="text-[11px] text-[#707a8c] mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-[14px] bg-[#e0e2e6] rounded-full overflow-hidden">
          <div className="h-full bg-[#336bc7] rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-[12px] font-bold w-10 text-right ${valueColor}`}>{value}</span>
      </div>
    </div>
  )
}

function DonutChart({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="flex flex-col items-center justify-center relative w-[116px] h-[116px]">
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
    <div className="bg-[#f5f7fa] rounded-xl overflow-hidden w-[150px]">
      <div className="h-1 w-full" style={{ backgroundColor: topColor }} />
      <div className="px-3 py-3">
        <p className="text-[28px] font-extrabold" style={{ color: valueColor }}>{value}</p>
        <p className="text-[10px] text-[#707a8c] mt-1">{label}</p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#f5f7fa] font-sans">

      {/* Sidebar */}
      <aside className="w-[200px] shrink-0 bg-[#1a1a1a] min-h-screen flex flex-col pt-6">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 mb-8">
          <span className="w-6 h-6 rounded-full bg-[#4caf50] flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a5d6a7]" />
          </span>
          <span className="text-white font-bold text-[15px]">Neotravel</span>
        </div>

        <p className="text-[9px] font-medium text-white px-6 mb-3 tracking-widest">PILOTAGE</p>

        {/* Active item */}
        <div className="mx-3 bg-[rgba(76,175,80,0.15)] rounded-[10px] flex items-center h-10 mb-1 relative overflow-hidden">
          <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#4caf50] rounded-r" />
          <span className="pl-[18px] text-white text-[13px] font-bold">Tableau de bord</span>
        </div>

        {['Demandes', 'Devis', 'Relances', 'Clients'].map((item) => (
          <a key={item} href="#"
            className="px-7 py-3 text-white text-[13px] hover:bg-white/5 transition-colors">
            {item}
          </a>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 px-10 py-9 overflow-auto">
        <h1 className="text-[26px] font-extrabold text-[#14141a]">Tableau de bord commercial</h1>
        <p className="text-[13px] text-[#707a8c] mt-1 mb-7">Vue direction — mise à jour en temps réel</p>

        {/* KPI row */}
        <div className="flex gap-7 mb-7">
          <KpiCard label="Leads reçus / jour"       value="60"    note="stable"         noteColor="text-[#21a666]" />
          <KpiCard label="Taux de conversion"        value="28%"   note="+5 pts"         noteColor="text-[#21a666]" />
          <KpiCard label="Délai moyen de réponse"    value="52min" note="obj < 60min"    noteColor="text-[#ed8f1a]" />
          <KpiCard label="Relances en attente"       value="14"    note="à traiter"      noteColor="text-[#f29c12]" />
        </div>

        {/* Pipeline + Demandes urgentes */}
        <div className="flex gap-7 mb-7">

          {/* Pipeline */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 flex-1">
            <p className="text-[16px] font-bold text-[#14141a] mb-5">Pipeline des devis</p>
            <BarRow label="Envoyés"  widthPx={420} maxPx={540} value="401" valueColor="text-[#174f9e]" />
            <BarRow label="Acceptés" widthPx={118} maxPx={540} value="112" valueColor="text-[#17995c]" />
            <BarRow label="Refusés"  widthPx={100} maxPx={540} value="95"  valueColor="text-[#d11a2e]" />
          </div>

          {/* Demandes urgentes */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 w-[520px] shrink-0 flex gap-4">
            <div className="flex-1">
              <p className="text-[14px] font-bold text-[#122147] mb-4">Demandes urgentes</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4caf50] shrink-0" />
                  <span className="text-[11px] font-medium text-[#14141a]">Traitées avant J+2 : 70%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f29c12] shrink-0" />
                  <span className="text-[11px] text-[#707a8c]">En attente : 30%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e0e2e6] shrink-0" />
                  <span className="text-[11px] text-[#707a8c]">Volume : ~9 urgences / jour</span>
                </div>
              </div>
              <p className="text-[11px] font-medium text-[#f29c12] mt-auto pt-8">
                30% des urgences encore en attente de traitement
              </p>
            </div>
            <DonutChart pct={70} color="#4caf50" label="" />
          </div>
        </div>

        {/* 3 donuts row */}
        <div className="flex gap-7 mb-7">

          {/* Devis sans relance */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 flex-1 flex gap-4">
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[#122147] mb-4">Devis complétés sans relance</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4caf50] shrink-0" />
                  <span className="text-[11px] font-medium text-[#14141a]">Acceptés direct : 62%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f29c12] shrink-0" />
                  <span className="text-[11px] text-[#707a8c]">Après relance : 38%</span>
                </div>
              </div>
              <p className="text-[11px] font-medium text-[#17995c] mt-6">↑ +5 pts vs mois précédent</p>
            </div>
            <DonutChart pct={62} color="#4caf50" label="" />
          </div>

          {/* Taux automatisation */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 flex-1 flex gap-4">
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[#122147] mb-4">{"Taux d'automatisation des dossiers"}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4caf50] shrink-0" />
                  <span className="text-[11px] font-medium text-[#14141a]">{"Traités par l'agent IA : 78%"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e0e2e6] shrink-0" />
                  <span className="text-[11px] text-[#707a8c]">Reprise humaine : 22%</span>
                </div>
              </div>
              <p className="text-[11px] font-medium text-[#ed8f1a] mt-6">{"Objectif phase 3 : > 80%"}</p>
            </div>
            <DonutChart pct={78} color="#4caf50" label="" />
          </div>

          {/* Intervention humaine */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 flex-1 flex gap-4">
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[#122147] mb-4">{"Détail de l'intervention humaine"}</p>
              <div className="space-y-2 mt-8">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e53935] shrink-0" />
                  <span className="text-[11px] text-[#707a8c]">{"HITL haute valeur (> 5 000 €) : 8%"}</span>
                </div>
              </div>
              <p className="text-[11px] font-medium text-[#d11a2e] mt-6">14 dossiers en attente commercial</p>
            </div>
            <div className="relative w-[116px] h-[116px] shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#e0e2e6" strokeWidth="12" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#f29c12" strokeWidth="12"
                  strokeDasharray={`${(22/100)*2*Math.PI*44} ${2*Math.PI*44}`} strokeLinecap="round" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="#e53935" strokeWidth="12"
                  strokeDasharray={`${(8/100)*2*Math.PI*44} ${2*Math.PI*44}`}
                  strokeDashoffset={`-${(22/100)*2*Math.PI*44}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[15px] font-bold text-[#f29c12]">22%</span>
                <span className="text-[9px] text-[#707a8c]">humain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Temps gagné + Relances */}
        <div className="flex gap-7">

          {/* Temps gagné */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 w-[560px] shrink-0">
            <p className="text-[14px] font-bold text-[#122147] mb-5">Temps gagné par les commerciaux / semaine</p>
            {[
              { label: 'Qualification leads',  pct: 100, value: '12h/sem', color: 'text-[#174f9e]' },
              { label: 'Rédaction devis',      pct: 67,  value: '8h/sem',  color: 'text-[#174f9e]' },
              { label: 'Relances manuelles',   pct: 50,  value: '6h/sem',  color: 'text-[#17995c]' },
              { label: 'Suivi pipeline',       pct: 33,  value: '4h/sem',  color: 'text-[#ed8f1a]' },
            ].map(({ label, pct, value, color }) => (
              <div key={label} className="mb-4">
                <p className="text-[11px] text-[#707a8c] mb-1">{label}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-[14px] bg-[#e0e2e6] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4caf50] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[11px] font-bold w-16 text-right ${color}`}>{value}</span>
                </div>
              </div>
            ))}
            <p className="text-[11px] font-medium text-[#17995c] mt-2">
              Total : ~30h/semaine récupérées par les commerciaux
            </p>
          </div>

          {/* Relances indicateurs */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 flex-1">
            <p className="text-[14px] font-bold text-[#122147] mb-5">Relances — Indicateurs</p>
            <div className="flex gap-4 mb-6">
              <StatBox value="42" valueColor="#174f9e" label="Envoyées"          topColor="#336bc7" />
              <StatBox value="5"  valueColor="#d11a2e" label="En retard"         topColor="#e53935" />
              <StatBox value="28" valueColor="#17995c" label="Réponses obtenues" topColor="#4caf50" />
            </div>
            <p className="text-[12px] font-medium text-[#122147] mb-2">Taux de réponse aux relances</p>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 h-3 bg-[#e0e2e6] rounded-full overflow-hidden">
                <div className="h-full bg-[#f29c12] rounded-full" style={{ width: '67%' }} />
              </div>
              <span className="text-[11px] font-bold text-[#17995c]">67%</span>
            </div>
            <p className="text-[11px] font-medium text-[#e53935] mt-4">⚠ 5 relances en retard — action requise</p>
          </div>
        </div>
      </main>
    </div>
  )
}
