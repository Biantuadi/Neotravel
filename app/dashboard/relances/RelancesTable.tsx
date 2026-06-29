'use client'

import { useState, useMemo } from 'react'

type TypeRelance = 'relance_1' | 'relance_2'
type StatutRelance = 'programmee' | 'envoyee' | 'echec'

export interface RelanceRow {
  id: string
  type: TypeRelance
  date_programmee: string
  envoyee_le: string | null
  statut: StatutRelance
  created_at: string
  demande: {
    nom_prospect: string
    statut: string
  } | null
}

const TYPE_CONFIG: Record<TypeRelance, { label: string; bg: string; text: string }> = {
  relance_1: { label: 'Relance 1', bg: 'bg-[rgba(51,107,199,0.12)]',  text: 'text-[#336bc7]' },
  relance_2: { label: 'Relance 2', bg: 'bg-[rgba(51,107,199,0.12)]',  text: 'text-[#336bc7]' },
}

// Le statut affiché dépend du statut relance + statut demande
function computeDisplayStatut(r: RelanceRow): {
  label: string; bg: string; text: string
} {
  // Si la demande est acceptée ou refusée → réponse reçue
  if (r.demande?.statut === 'accepte' || r.demande?.statut === 'refuse') {
    return { label: 'Réponse reçue', bg: 'bg-[rgba(76,175,80,0.12)]',  text: 'text-[#4caf50]' }
  }
  if (r.statut === 'envoyee') {
    return { label: 'Envoyée', bg: 'bg-[rgba(51,107,199,0.12)]', text: 'text-[#336bc7]' }
  }
  if (r.statut === 'echec') {
    return { label: 'Échec', bg: 'bg-[rgba(229,57,53,0.12)]', text: 'text-[#e53935]' }
  }
  // programmee
  const isPast = new Date(r.date_programmee) < new Date()
  if (isPast) {
    return { label: 'En retard', bg: 'bg-[rgba(229,57,53,0.12)]', text: 'text-[#e53935]' }
  }
  return { label: 'En attente', bg: 'bg-[rgba(242,156,18,0.12)]', text: 'text-[#f29c12]' }
}

function Badge({ cfg }: { cfg: { label: string; bg: string; text: string } }) {
  return (
    <span className={`inline-flex items-center px-3 h-6 rounded-full text-[11px] font-medium whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function RelancesTable({ relances }: { relances: RelanceRow[] }) {
  const [search, setSearch]   = useState('')
  const [type, setType]       = useState<TypeRelance | 'tous'>('tous')
  const [statut, setStatut]   = useState<'tous' | 'envoyee' | 'programmee' | 'reponse' | 'retard'>('tous')

  const filtered = useMemo(() => {
    return relances.filter(r => {
      const q = search.toLowerCase()
      const nom = r.demande?.nom_prospect ?? ''
      const matchSearch = !q || nom.toLowerCase().includes(q)
      const matchType = type === 'tous' || r.type === type
      if (!matchSearch || !matchType) return false

      if (statut === 'tous') return true
      const display = computeDisplayStatut(r)
      if (statut === 'envoyee')    return display.label === 'Envoyée'
      if (statut === 'programmee') return display.label === 'En attente'
      if (statut === 'reponse')    return display.label === 'Réponse reçue'
      if (statut === 'retard')     return display.label === 'En retard'
      return true
    }).sort((a, b) =>
      new Date(b.date_programmee).getTime() - new Date(a.date_programmee).getTime()
    )
  }, [relances, search, type, statut])

  return (
    <>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 gap-2 min-w-[200px] flex-1">
          <span className="text-[#707a8c] text-[13px]">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 text-[12px] text-[#12151a] placeholder:text-[#707a8c] outline-none bg-transparent"
          />
        </div>

        <select
          value={type}
          onChange={e => setType(e.target.value as TypeRelance | 'tous')}
          className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] outline-none cursor-pointer"
        >
          <option value="tous">Type : Tous</option>
          <option value="relance_1">Relance 1</option>
          <option value="relance_2">Relance 2</option>
        </select>

        <select
          value={statut}
          onChange={e => setStatut(e.target.value as typeof statut)}
          className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] outline-none cursor-pointer"
        >
          <option value="tous">Statut : Tous</option>
          <option value="envoyee">Envoyée</option>
          <option value="programmee">En attente</option>
          <option value="reponse">Réponse reçue</option>
          <option value="retard">En retard</option>
        </select>
      </div>

      {/* Table desktop */}
      <div className="hidden md:block">
        <div className="bg-[#f5f7fa] rounded-[8px] h-10 grid grid-cols-[1fr_120px_110px_110px_130px] items-center px-4 mb-1">
          {['CLIENT', 'TYPE', 'DATE PRÉVUE', 'DATE ENVOI', 'STATUT'].map(col => (
            <p key={col} className="text-[11px] font-semibold text-[#707a8c]">{col}</p>
          ))}
        </div>

        <div className="space-y-1">
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#e0e2e6] rounded-[8px] py-8 text-center text-[13px] text-[#707a8c]">
              Aucune relance trouvée
            </div>
          ) : filtered.map(r => {
            const display = computeDisplayStatut(r)
            return (
              <div key={r.id}
                className="bg-white border border-[#e0e2e6] rounded-[8px] h-12 grid grid-cols-[1fr_120px_110px_110px_130px] items-center px-4 hover:bg-[#fafbfc] transition-colors cursor-pointer">
                <p className="text-[12px] text-[#12151a] truncate pr-2">{r.demande?.nom_prospect ?? '—'}</p>
                <Badge cfg={TYPE_CONFIG[r.type]} />
                <p className="text-[12px] text-[#12151a]">{fmt(r.date_programmee)}</p>
                <p className="text-[12px] text-[#12151a]">{fmt(r.envoyee_le)}</p>
                <Badge cfg={display} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#e0e2e6] rounded-xl py-8 text-center text-[13px] text-[#707a8c]">
            Aucune relance trouvée
          </div>
        ) : filtered.map(r => {
          const display = computeDisplayStatut(r)
          return (
            <div key={r.id} className="bg-white border border-[#e0e2e6] rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[13px] font-semibold text-[#12151a]">{r.demande?.nom_prospect ?? '—'}</p>
                <Badge cfg={display} />
              </div>
              <div className="flex items-center gap-3">
                <Badge cfg={TYPE_CONFIG[r.type]} />
                <span className="text-[11px] text-[#707a8c]">Prévu : {fmt(r.date_programmee)}</span>
                {r.envoyee_le && <span className="text-[11px] text-[#707a8c]">Envoyé : {fmt(r.envoyee_le)}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-[#707a8c] mt-3 text-right">
          {filtered.length} relance{filtered.length > 1 ? 's' : ''}
        </p>
      )}
    </>
  )
}
