'use client'

import { useState, useMemo } from 'react'

// ── Types ─────────────────────────────────────────────────

export interface ClientDevis {
  id: string
  prix_ttc: number
  statut: string
}

export interface ClientDemande {
  id: string
  depart: string | null
  destination: string | null
  date_depart: string | null
  statut: string
}

export interface ClientRelance {
  id: string
  type: string
  date_programmee: string
  statut: string
}

export interface ClientRow {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  nb_demandes: number
  derniere_demande: string | null
  created_at: string
  demandes: ClientDemande[]
  devis: ClientDevis[]
  relances: ClientRelance[]
}

// ── Calcul statut client ──────────────────────────────────

type ClientStatut = 'converti' | 'perdu' | 'en_attente' | 'actif' | 'nouveau'

function getStatut(c: ClientRow): ClientStatut {
  const statuts = c.demandes.map(d => d.statut)
  if (statuts.includes('accepte')) return 'converti'
  if (statuts.length > 0 && statuts.every(s => s === 'refuse')) return 'perdu'
  if (statuts.some(s => ['devis_envoye', 'relance_1', 'relance_2'].includes(s))) return 'en_attente'
  if (statuts.length > 0) return 'actif'
  return 'nouveau'
}

const STATUT_CFG: Record<ClientStatut, { label: string; bg: string; text: string }> = {
  converti:   { label: 'Converti',   bg: 'bg-[rgba(76,175,80,0.12)]',   text: 'text-[#4caf50]' },
  perdu:      { label: 'Perdu',      bg: 'bg-[rgba(229,57,53,0.12)]',   text: 'text-[#e53935]' },
  en_attente: { label: 'En attente', bg: 'bg-[rgba(242,156,18,0.12)]',  text: 'text-[#f29c12]' },
  actif:      { label: 'Actif',      bg: 'bg-[rgba(51,107,199,0.12)]',  text: 'text-[#336bc7]' },
  nouveau:    { label: 'Nouveau',    bg: 'bg-[rgba(112,122,140,0.12)]', text: 'text-[#707a8c]' },
}

function Badge({ s }: { s: ClientStatut }) {
  const c = STATUT_CFG[s]
  return (
    <span className={`inline-flex items-center px-3 h-6 rounded-full text-[11px] font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtShort(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
}

// Libellé statut demande
const STATUT_DEMANDE_LABEL: Record<string, string> = {
  nouveau_lead: 'Nouvelle', incomplet: 'Incomplète', qualifie: 'Qualifiée',
  devis_envoye: 'Devis envoyé', relance_1: 'Relance 1', relance_2: 'Relance 2',
  accepte: 'Traitée', refuse: 'Refusée', cas_complexe: 'En cours', cloture: 'Clôturée',
}

const STATUT_DEVIS_LABEL: Record<string, string> = {
  brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Signé', refuse: 'Refusé', expire: 'Expiré',
}

const STATUT_RELANCE_LABEL: Record<string, string> = {
  programmee: 'En attente', envoyee: 'Envoyée', echec: 'Échec',
}

// ── Panneau de détail ─────────────────────────────────────

function FicheClient({ client, onClose }: { client: ClientRow; onClose: () => void }) {
  const s = getStatut(client)
  return (
    <div className="fixed lg:absolute inset-y-0 right-0 lg:right-auto lg:inset-y-auto w-full max-w-[380px] bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-y-auto z-50 lg:z-auto"
      style={{ maxHeight: '100vh' }}>
      {/* Header coloré */}
      <div className="bg-[#2e7d32] px-5 py-5 rounded-t-2xl relative">
        <button onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white text-lg leading-none cursor-pointer">✕</button>
        <p className="text-white font-bold text-[16px]">{client.nom}</p>
        <p className="text-white/80 text-[12px] mt-1">{client.email ?? '—'}</p>
      </div>

      {/* Infos de base */}
      <div className="px-5 py-4 space-y-4 border-b border-[#e0e2e6]">
        {[
          { label: 'Téléphone',       value: client.telephone ?? '—' },
          { label: 'Dernier contact', value: fmt(client.derniere_demande) },
          { label: 'Statut',          value: STATUT_CFG[s].label },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center">
            <span className="text-[11px] text-[#707a8c] w-[140px] shrink-0">{label}</span>
            <span className="text-[12px] font-semibold text-[#12151a]">{value}</span>
          </div>
        ))}
      </div>

      {/* Demandes */}
      <div className="px-5 py-4 border-b border-[#e0e2e6]">
        <p className="text-[13px] font-bold text-[#12151a] mb-3">Demandes ({client.demandes.length})</p>
        {client.demandes.length === 0 ? (
          <p className="text-[11px] text-[#707a8c]">Aucune demande</p>
        ) : client.demandes.slice(0, 5).map(d => (
          <p key={d.id} className="text-[11px] text-[#707a8c] py-1">
            {d.depart && d.destination ? `${d.depart} → ${d.destination}` : '—'}
            {d.date_depart ? ` — ${fmtShort(d.date_depart)}` : ''}
            {` — ${STATUT_DEMANDE_LABEL[d.statut] ?? d.statut}`}
          </p>
        ))}
      </div>

      {/* Devis */}
      <div className="px-5 py-4 border-b border-[#e0e2e6]">
        <p className="text-[13px] font-bold text-[#12151a] mb-3">Devis ({client.devis.length})</p>
        {client.devis.length === 0 ? (
          <p className="text-[11px] text-[#707a8c]">Aucun devis</p>
        ) : client.devis.slice(0, 5).map((d, i) => (
          <p key={d.id} className="text-[11px] text-[#707a8c] py-1">
            {`DEV-${String(i + 1).padStart(3, '0')} — ${fmtEur(d.prix_ttc)} — ${STATUT_DEVIS_LABEL[d.statut] ?? d.statut}`}
          </p>
        ))}
      </div>

      {/* Relances */}
      <div className="px-5 py-4">
        <p className="text-[13px] font-bold text-[#12151a] mb-3">Relances ({client.relances.length})</p>
        {client.relances.length === 0 ? (
          <p className="text-[11px] text-[#707a8c]">Aucune relance</p>
        ) : client.relances.slice(0, 5).map(r => (
          <p key={r.id} className="text-[11px] text-[#707a8c] py-1">
            {`${r.type === 'relance_1' ? 'Relance 1' : 'Relance 2'} — ${fmtShort(r.date_programmee)} — ${STATUT_RELANCE_LABEL[r.statut] ?? r.statut}`}
          </p>
        ))}
      </div>
    </div>
  )
}

// ── Table principale ──────────────────────────────────────

type SortKey = 'nom' | 'derniere_demande' | 'nb_demandes'

export default function ClientsView({ clients }: { clients: ClientRow[] }) {
  const [search, setSearch]       = useState('')
  const [statutFilter, setStatut] = useState<ClientStatut | 'tous'>('tous')
  const [sortKey, setSortKey]     = useState<SortKey>('derniere_demande')
  const [selected, setSelected]   = useState<ClientRow | null>(null)

  const filtered = useMemo(() => {
    return clients
      .filter(c => {
        const q = search.toLowerCase()
        const matchSearch = !q ||
          c.nom.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q)
        const matchStatut = statutFilter === 'tous' || getStatut(c) === statutFilter
        return matchSearch && matchStatut
      })
      .sort((a, b) => {
        if (sortKey === 'nom') return a.nom.localeCompare(b.nom, 'fr')
        if (sortKey === 'nb_demandes') return b.nb_demandes - a.nb_demandes
        const da = new Date(a.derniere_demande ?? 0).getTime()
        const db = new Date(b.derniere_demande ?? 0).getTime()
        return db - da
      })
  }, [clients, search, statutFilter, sortKey])

  return (
    <div className="relative flex gap-4">
      <div className={`flex-1 min-w-0 ${selected ? 'hidden xl:block' : ''}`}>

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
            onChange={e => setStatut(e.target.value as ClientStatut | 'tous')}
            className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] outline-none cursor-pointer"
          >
            <option value="tous">Statut : Tous</option>
            {(Object.keys(STATUT_CFG) as ClientStatut[]).map(s => (
              <option key={s} value={s}>{STATUT_CFG[s].label}</option>
            ))}
          </select>

          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="bg-white border border-[#e0e2e6] rounded-[10px] h-10 px-3 text-[12px] text-[#707a8c] outline-none cursor-pointer"
          >
            <option value="derniere_demande">Trier : dernier contact</option>
            <option value="nom">Trier : nom</option>
            <option value="nb_demandes">Trier : demandes</option>
          </select>
        </div>

        {/* Table desktop */}
        <div className="hidden md:block">
          <div className="bg-[#f5f7fa] rounded-[8px] h-10 grid grid-cols-[1fr_1fr_110px_70px_60px_130px_100px] items-center px-4 mb-1">
            {['NOM', 'EMAIL', 'TÉLÉPHONE', 'DEMANDES', 'DEVIS', 'DERNIER CONTACT', 'STATUT'].map(col => (
              <p key={col} className="text-[11px] font-semibold text-[#707a8c]">{col}</p>
            ))}
          </div>

          <div className="space-y-1">
            {filtered.length === 0 ? (
              <div className="bg-white border border-[#e0e2e6] rounded-[8px] py-8 text-center text-[13px] text-[#707a8c]">
                Aucun client trouvé
              </div>
            ) : filtered.map(c => {
              const s = getStatut(c)
              const isSelected = selected?.id === c.id
              return (
                <div key={c.id}
                  onClick={() => setSelected(isSelected ? null : c)}
                  className={`bg-white border rounded-[8px] h-12 grid grid-cols-[1fr_1fr_110px_70px_60px_130px_100px] items-center px-4 cursor-pointer transition-colors
                    ${isSelected ? 'border-[#4caf50] bg-[rgba(76,175,80,0.04)]' : 'border-[#e0e2e6] hover:bg-[#fafbfc]'}`}>
                  <p className="text-[12px] text-[#12151a] truncate pr-2 font-medium">{c.nom}</p>
                  <p className="text-[12px] text-[#12151a] truncate pr-2">{c.email ?? '—'}</p>
                  <p className="text-[12px] text-[#12151a] truncate pr-1">{c.telephone ?? '—'}</p>
                  <p className="text-[12px] text-[#12151a]">{c.nb_demandes}</p>
                  <p className="text-[12px] text-[#12151a]">{c.devis.length}</p>
                  <p className="text-[12px] text-[#12151a]">{fmt(c.derniere_demande)}</p>
                  <Badge s={s} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Cards mobile */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#e0e2e6] rounded-xl py-8 text-center text-[13px] text-[#707a8c]">
              Aucun client trouvé
            </div>
          ) : filtered.map(c => {
            const s = getStatut(c)
            return (
              <div key={c.id}
                onClick={() => setSelected(c)}
                className="bg-white border border-[#e0e2e6] rounded-xl p-4 cursor-pointer hover:bg-[#fafbfc] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[13px] font-semibold text-[#12151a]">{c.nom}</p>
                  <Badge s={s} />
                </div>
                <p className="text-[12px] text-[#707a8c] mb-2">{c.email ?? '—'}</p>
                <div className="flex gap-4">
                  <span className="text-[11px] text-[#707a8c]">{c.nb_demandes} demande{c.nb_demandes !== 1 ? 's' : ''}</span>
                  <span className="text-[11px] text-[#707a8c]">{c.devis.length} devis</span>
                  <span className="text-[11px] text-[#707a8c]">{fmt(c.derniere_demande)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length > 0 && (
          <p className="text-[11px] text-[#707a8c] mt-3 text-right">
            {filtered.length} client{filtered.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Panneau de détail */}
      {selected && (
        <div className="shrink-0 w-full xl:w-[380px]">
          <FicheClient client={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
