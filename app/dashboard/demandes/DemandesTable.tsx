'use client'

import { useState, useMemo } from 'react'

type Urgence = 'faible' | 'normale' | 'urgente'
type Statut =
  | 'nouveau_lead' | 'incomplet' | 'qualifie' | 'devis_envoye'
  | 'relance_1' | 'relance_2' | 'accepte' | 'refuse' | 'cas_complexe' | 'cloture'

export interface Demande {
  id: string
  nom_prospect: string
  depart: string | null
  destination: string | null
  date_depart: string | null
  nb_passagers: number | null
  urgence: Urgence
  statut: Statut
  date_creation: string
}

const URGENCE_CONFIG: Record<Urgence, { label: string; bg: string; text: string }> = {
  faible:   { label: 'Faible',     bg: 'bg-[rgba(112,122,140,0.12)]', text: 'text-[#707a8c]' },
  normale:  { label: 'Normal',     bg: 'bg-[rgba(112,122,140,0.12)]', text: 'text-[#707a8c]' },
  urgente:  { label: 'Urgent',     bg: 'bg-[rgba(242,156,18,0.12)]',  text: 'text-[#f29c12]' },
}

const STATUT_CONFIG: Record<Statut, { label: string; bg: string; text: string }> = {
  nouveau_lead: { label: 'Nouvelle',    bg: 'bg-[rgba(51,107,199,0.12)]', text: 'text-[#336bc7]' },
  incomplet:    { label: 'Incomplète',  bg: 'bg-[rgba(242,156,18,0.12)]', text: 'text-[#f29c12]' },
  qualifie:     { label: 'Qualifiée',   bg: 'bg-[rgba(76,175,80,0.12)]',  text: 'text-[#4caf50]' },
  devis_envoye: { label: 'Devis envoyé',bg: 'bg-[rgba(51,107,199,0.12)]', text: 'text-[#336bc7]' },
  relance_1:    { label: 'Relance 1',   bg: 'bg-[rgba(242,156,18,0.12)]', text: 'text-[#f29c12]' },
  relance_2:    { label: 'Relance 2',   bg: 'bg-[rgba(242,156,18,0.12)]', text: 'text-[#ed8f1a]' },
  accepte:      { label: 'Traitée',     bg: 'bg-[rgba(46,125,50,0.12)]',  text: 'text-[#2e7d32]' },
  refuse:       { label: 'Refusée',     bg: 'bg-[rgba(229,57,53,0.12)]',  text: 'text-[#e53935]' },
  cas_complexe: { label: 'En cours',    bg: 'bg-[rgba(51,107,199,0.12)]', text: 'text-[#336bc7]' },
  cloture:      { label: 'Clôturée',    bg: 'bg-[rgba(112,122,140,0.12)]',text: 'text-[#707a8c]' },
}

function Badge({ config }: { config: { label: string; bg: string; text: string } }) {
  return (
    <span className={`inline-flex items-center px-3 h-6 rounded-full text-[11px] font-medium ${config.bg} ${config.text} whitespace-nowrap`}>
      {config.label}
    </span>
  )
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function DemandesTable({ demandes }: { demandes: Demande[] }) {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<Statut | 'tous'>('tous')
  const [urgenceFilter, setUrgenceFilter] = useState<Urgence | 'tous'>('tous')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    return demandes
      .filter(d => {
        const q = search.toLowerCase()
        const matchSearch = !q ||
          d.nom_prospect.toLowerCase().includes(q) ||
          (d.depart ?? '').toLowerCase().includes(q) ||
          (d.destination ?? '').toLowerCase().includes(q)
        const matchStatut = statutFilter === 'tous' || d.statut === statutFilter
        const matchUrgence = urgenceFilter === 'tous' || d.urgence === urgenceFilter
        return matchSearch && matchStatut && matchUrgence
      })
      .sort((a, b) => {
        const da = new Date(a.date_creation).getTime()
        const db = new Date(b.date_creation).getTime()
        return sort === 'desc' ? db - da : da - db
      })
  }, [demandes, search, statutFilter, urgenceFilter, sort])

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
          value={statutFilter}
          onChange={e => setStatutFilter(e.target.value as Statut | 'tous')}
          className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] outline-none cursor-pointer"
        >
          <option value="tous">Statut : Tous</option>
          {(Object.keys(STATUT_CONFIG) as Statut[]).map(s => (
            <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
          ))}
        </select>

        <select
          value={urgenceFilter}
          onChange={e => setUrgenceFilter(e.target.value as Urgence | 'tous')}
          className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] outline-none cursor-pointer"
        >
          <option value="tous">Urgence : Tous</option>
          <option value="faible">Faible</option>
          <option value="normale">Normale</option>
          <option value="urgente">Urgente</option>
        </select>

        <button
          onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
          className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] whitespace-nowrap cursor-pointer hover:bg-[#f5f7fa] transition-colors"
        >
          Trier par date {sort === 'desc' ? '▾' : '▴'}
        </button>
      </div>

      {/* Table desktop */}
      <div className="hidden md:block">
        {/* Header */}
        <div className="bg-[#f5f7fa] rounded-[8px] h-10 grid grid-cols-[1fr_1fr_80px_80px_110px_110px] items-center px-4 mb-1">
          {['CLIENT', 'TRAJET', 'DATE', 'PASS.', 'URGENCE', 'STATUT'].map(col => (
            <p key={col} className="text-[11px] font-semibold text-[#707a8c]">{col}</p>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#e0e2e6] rounded-[8px] py-8 text-center text-[13px] text-[#707a8c]">
              Aucune demande trouvée
            </div>
          ) : filtered.map(d => (
            <div key={d.id}
              className="bg-white border border-[#e0e2e6] rounded-[8px] h-12 grid grid-cols-[1fr_1fr_80px_80px_110px_110px] items-center px-4 hover:bg-[#fafbfc] transition-colors cursor-pointer">
              <p className="text-[12px] text-[#12151a] truncate pr-2">{d.nom_prospect}</p>
              <p className="text-[12px] text-[#12151a] truncate pr-2">
                {d.depart && d.destination ? `${d.depart} → ${d.destination}` : d.depart ?? '—'}
              </p>
              <p className="text-[12px] text-[#12151a]">{formatDate(d.date_depart)}</p>
              <p className="text-[12px] text-[#12151a]">{d.nb_passagers ?? '—'}</p>
              <Badge config={URGENCE_CONFIG[d.urgence]} />
              <Badge config={STATUT_CONFIG[d.statut]} />
            </div>
          ))}
        </div>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#e0e2e6] rounded-xl py-8 text-center text-[13px] text-[#707a8c]">
            Aucune demande trouvée
          </div>
        ) : filtered.map(d => (
          <div key={d.id} className="bg-white border border-[#e0e2e6] rounded-xl p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-[13px] font-semibold text-[#12151a]">{d.nom_prospect}</p>
              <Badge config={STATUT_CONFIG[d.statut]} />
            </div>
            <p className="text-[12px] text-[#707a8c] mb-1">
              {d.depart && d.destination ? `${d.depart} → ${d.destination}` : '—'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-[#707a8c]">{formatDate(d.date_depart)}</span>
              {d.nb_passagers && <span className="text-[11px] text-[#707a8c]">{d.nb_passagers} pass.</span>}
              <Badge config={URGENCE_CONFIG[d.urgence]} />
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-[#707a8c] mt-3 text-right">{filtered.length} demande{filtered.length > 1 ? 's' : ''}</p>
      )}
    </>
  )
}
