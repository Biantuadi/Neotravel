'use client'

import { useState, useMemo } from 'react'

type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'

export interface DevisRow {
  id: string
  prix_ttc: number
  envoye_le: string | null
  statut: StatutDevis
  pdf_url: string | null
  created_at: string
  demande: {
    nom_prospect: string
    depart: string | null
    destination: string | null
  } | null
}

const STATUT_CONFIG: Record<StatutDevis, { label: string; bg: string; text: string }> = {
  brouillon: { label: 'Brouillon',  bg: 'bg-[rgba(112,122,140,0.12)]', text: 'text-[#707a8c]' },
  envoye:    { label: 'Envoyé',     bg: 'bg-[rgba(51,107,199,0.12)]',  text: 'text-[#336bc7]' },
  accepte:   { label: 'Signé',      bg: 'bg-[rgba(76,175,80,0.12)]',   text: 'text-[#4caf50]' },
  refuse:    { label: 'Refusé',     bg: 'bg-[rgba(229,57,53,0.12)]',   text: 'text-[#e53935]' },
  expire:    { label: 'Expiré',     bg: 'bg-[rgba(112,122,140,0.12)]', text: 'text-[#707a8c]' },
}

function Badge({ s }: { s: StatutDevis }) {
  const c = STATUT_CONFIG[s]
  return (
    <span className={`inline-flex items-center px-3 h-6 rounded-full text-[11px] font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function fmtMontant(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' €'
}

// Calcule une date d'expiration fictive : 7 jours après envoi
function expiration(envoye_le: string | null) {
  if (!envoye_le) return '—'
  const d = new Date(envoye_le)
  d.setDate(d.getDate() + 7)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function DevisTable({ devis }: { devis: DevisRow[] }) {
  const [search, setSearch]   = useState('')
  const [statut, setStatut]   = useState<StatutDevis | 'tous'>('tous')
  const [sort, setSort]       = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    return devis
      .filter(d => {
        const q = search.toLowerCase()
        const nom = d.demande?.nom_prospect ?? ''
        const dep = d.demande?.depart ?? ''
        const dest = d.demande?.destination ?? ''
        const matchSearch = !q ||
          nom.toLowerCase().includes(q) ||
          dep.toLowerCase().includes(q) ||
          dest.toLowerCase().includes(q)
        const matchStatut = statut === 'tous' || d.statut === statut
        return matchSearch && matchStatut
      })
      .sort((a, b) => {
        const da = new Date(a.created_at).getTime()
        const db = new Date(b.created_at).getTime()
        return sort === 'desc' ? db - da : da - db
      })
  }, [devis, search, statut, sort])

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
          value={statut}
          onChange={e => setStatut(e.target.value as StatutDevis | 'tous')}
          className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] outline-none cursor-pointer"
        >
          <option value="tous">Statut : Tous</option>
          {(Object.keys(STATUT_CONFIG) as StatutDevis[]).map(s => (
            <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
          ))}
        </select>

        <button
          onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
          className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] whitespace-nowrap cursor-pointer hover:bg-[#f5f7fa] transition-colors"
        >
          Date {sort === 'desc' ? '▾' : '▴'}
        </button>
      </div>

      {/* Table desktop */}
      <div className="hidden md:block">
        <div className="bg-[#f5f7fa] rounded-[8px] h-10 grid grid-cols-[1fr_1fr_100px_90px_110px_90px] items-center px-4 mb-1">
          {['CLIENT', 'TRAJET', 'MONTANT', 'DATE ENVOI', 'STATUT', 'EXPIRATION'].map(col => (
            <p key={col} className="text-[11px] font-semibold text-[#707a8c]">{col}</p>
          ))}
        </div>

        <div className="space-y-1">
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#e0e2e6] rounded-[8px] py-8 text-center text-[13px] text-[#707a8c]">
              Aucun devis trouvé
            </div>
          ) : filtered.map(d => (
            <div key={d.id}
              className="bg-white border border-[#e0e2e6] rounded-[8px] h-12 grid grid-cols-[1fr_1fr_100px_90px_110px_90px] items-center px-4 hover:bg-[#fafbfc] transition-colors cursor-pointer">
              <p className="text-[12px] text-[#12151a] truncate pr-2">{d.demande?.nom_prospect ?? '—'}</p>
              <p className="text-[12px] text-[#12151a] truncate pr-2">
                {d.demande?.depart && d.demande?.destination
                  ? `${d.demande.depart} → ${d.demande.destination}`
                  : '—'}
              </p>
              <p className="text-[12px] text-[#12151a] font-medium">{fmtMontant(d.prix_ttc)}</p>
              <p className="text-[12px] text-[#12151a]">{fmt(d.envoye_le)}</p>
              <Badge s={d.statut} />
              <p className="text-[12px] text-[#12151a]">{expiration(d.envoye_le)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#e0e2e6] rounded-xl py-8 text-center text-[13px] text-[#707a8c]">
            Aucun devis trouvé
          </div>
        ) : filtered.map(d => (
          <div key={d.id} className="bg-white border border-[#e0e2e6] rounded-xl p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[13px] font-semibold text-[#12151a]">{d.demande?.nom_prospect ?? '—'}</p>
              <Badge s={d.statut} />
            </div>
            <p className="text-[12px] text-[#707a8c] mb-2">
              {d.demande?.depart && d.demande?.destination
                ? `${d.demande.depart} → ${d.demande.destination}`
                : '—'}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#12151a]">{fmtMontant(d.prix_ttc)}</span>
              <span className="text-[11px] text-[#707a8c]">Envoyé le {fmt(d.envoye_le)}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-[#707a8c] mt-3 text-right">
          {filtered.length} devis
        </p>
      )}
    </>
  )
}
