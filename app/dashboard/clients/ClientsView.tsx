'use client'

import { useState, useMemo, useEffect } from 'react'

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

type ClientStatut = 'converti' | 'perdu' | 'en_attente' | 'actif' | 'nouveau'

function getStatut(c: ClientRow): ClientStatut {
  const statuts = c.demandes.map(d => d.statut)
  if (statuts.includes('accepte')) return 'converti'
  if (statuts.length > 0 && statuts.every(s => s === 'refuse')) return 'perdu'
  if (statuts.some(s => ['devis_envoye', 'relance_1', 'relance_2'].includes(s))) return 'en_attente'
  if (statuts.length > 0) return 'actif'
  return 'nouveau'
}

const STATUT_CFG: Record<ClientStatut, { label: string; color: string; bg: string; border: string; dot: string }> = {
  converti:   { label: 'Converti',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  perdu:      { label: 'Perdu',      color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  en_attente: { label: 'En attente', color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  actif:      { label: 'Actif',      color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  nouveau:    { label: 'Nouveau',    color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: '#d1d5db' },
}

const STATUT_DEMANDE_LABEL: Record<string, string> = {
  nouveau_lead: 'Nouvelle', incomplet: 'Incomplète', qualifie: 'Qualifiée',
  devis_envoye: 'Devis envoyé', relance_1: 'Relance 1', relance_2: 'Relance 2',
  accepte: 'Traitée', refuse: 'Refusée', cas_complexe: 'En cours', cloture: 'Clôturée',
}

const STATUT_DEVIS_LABEL: Record<string, string> = {
  brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Signé', refuse: 'Refusé', expire: 'Expiré',
}

const STATUT_DEVIS_COLOR: Record<string, string> = {
  brouillon: '#6b7280', envoye: '#2563eb', accepte: '#16a34a', refuse: '#dc2626', expire: '#9ca3af',
}

function fmt(d: string | null, long = false) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', long
    ? { day: '2-digit', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }
  )
}

function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)

// ── Dialog fiche client ───────────────────────────────────

function ClientDialog({ client, onClose }: { client: ClientRow; onClose: () => void }) {
  const s = getStatut(client)
  const cfg = STATUT_CFG[s]
  const montantTotal = client.devis
    .filter(d => d.statut === 'accepte')
    .reduce((sum, d) => sum + d.prix_ttc, 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)', zIndex: 40 }}
      />

      {/* Dialog centrée */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        background: 'white', borderRadius: 16, zIndex: 50,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'dialogIn 0.2s ease',
      }}>
        <style>{`@keyframes dialogIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.97) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }`}</style>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{ width: 48, height: 48, borderRadius: 12, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
            {initials(client.nom)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{client.nom}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
              {client.email && <span style={{ fontSize: 12, color: '#64748b' }}>{client.email}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
            <IconX />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Demandes', value: String(client.nb_demandes) },
              { label: 'Devis', value: String(client.devis.length) },
              { label: 'CA signé', value: montantTotal > 0 ? fmtEur(montantTotal) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #f1f5f9' }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#94a3b8' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Infos contact */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Contact</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1.5px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
              {[
                { label: 'Email', value: client.email ?? '—' },
                { label: 'Téléphone', value: client.telephone ?? '—' },
                { label: 'Dernier contact', value: fmt(client.derniere_demande, true) },
                { label: 'Client depuis', value: fmt(client.created_at, true) },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none', background: 'white' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Demandes */}
          {client.demandes.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Demandes ({client.demandes.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {client.demandes.slice(0, 5).map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 8, padding: '9px 12px', border: '1.5px solid #f1f5f9' }}>
                    <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 500 }}>
                      {d.depart && d.destination ? `${d.depart} → ${d.destination}` : 'Trajet non précisé'}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{STATUT_DEMANDE_LABEL[d.statut] ?? d.statut}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Devis */}
          {client.devis.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Devis ({client.devis.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {client.devis.slice(0, 5).map((d, i) => {
                  const color = STATUT_DEVIS_COLOR[d.statut] ?? '#6b7280'
                  return (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 8, padding: '9px 12px', border: '1.5px solid #f1f5f9' }}>
                      <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 500 }}>DEV-{String(i + 1).padStart(3, '0')}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fmtEur(d.prix_ttc)}</span>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 12, background: 'white', color, border: `1px solid ${color}20` }}>{STATUT_DEVIS_LABEL[d.statut] ?? d.statut}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
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
        const matchSearch = !q || c.nom.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q)
        const matchStatut = statutFilter === 'tous' || getStatut(c) === statutFilter
        return matchSearch && matchStatut
      })
      .sort((a, b) => {
        if (sortKey === 'nom') return a.nom.localeCompare(b.nom, 'fr')
        if (sortKey === 'nb_demandes') return b.nb_demandes - a.nb_demandes
        return new Date(b.derniere_demande ?? 0).getTime() - new Date(a.derniere_demande ?? 0).getTime()
      })
  }, [clients, search, statutFilter, sortKey])

  return (
    <>
      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40, color: '#94a3b8' }}>
          <IconSearch />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            style={{ flex: 1, fontSize: 13, color: '#0f172a', border: 'none', outline: 'none', background: 'transparent' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40, color: '#94a3b8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <select value={statutFilter} onChange={e => setStatut(e.target.value as ClientStatut | 'tous')}
            style={{ fontSize: 13, color: '#475569', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}>
            <option value="tous">Tous les statuts</option>
            {(Object.keys(STATUT_CFG) as ClientStatut[]).map(s => (
              <option key={s} value={s}>{STATUT_CFG[s].label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40, color: '#94a3b8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
            style={{ fontSize: 13, color: '#475569', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}>
            <option value="derniere_demande">Dernier contact</option>
            <option value="nom">Nom</option>
            <option value="nb_demandes">Nbre demandes</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ marginBottom: 12, color: '#cbd5e1', display: 'flex', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', margin: '0 0 6px' }}>Aucun client trouvé</p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Les prospects qualifiés apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(c => {
            const s = getStatut(c)
            const cfg = STATUT_CFG[s]
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#f1f5f9'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '14px 0 0 14px', background: cfg.dot }} />

                <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                  {initials(c.nom)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {c.email && <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{c.email}</span>}
                    {c.email && c.telephone && <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>}
                    {c.telephone && <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.telephone}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{c.nb_demandes}</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>demandes</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{c.devis.length}</p>
                    <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>devis</p>
                  </div>
                </div>

                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#94a3b8' }}>Dernier contact</p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: '#475569' }}>{fmt(c.derniere_demande)}</p>
                </div>

                <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {cfg.label}
                </span>

                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 10 }}>
          {filtered.length} client{filtered.length > 1 ? 's' : ''}
        </p>
      )}

      {selected && <ClientDialog client={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
