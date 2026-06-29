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

const STATUT_CONFIG: Record<StatutDevis, { label: string; color: string; bg: string; border: string; dot: string }> = {
  brouillon: { label: 'Brouillon', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: '#d1d5db' },
  envoye:    { label: 'Envoyé',    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  accepte:   { label: 'Signé',     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  refuse:    { label: 'Refusé',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' },
  expire:    { label: 'Expiré',    color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', dot: '#d1d5db' },
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function fmtMontant(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function expiration(envoye_le: string | null) {
  if (!envoye_le) return null
  const d = new Date(envoye_le)
  d.setDate(d.getDate() + 7)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
  return { label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), daysLeft: diff }
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "à l'instant"
  if (h < 24) return `il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days === 1) return 'hier'
  return `il y a ${days}j`
}

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)
const IconArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IconFile = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
)

export default function DevisTable({ devis }: { devis: DevisRow[] }) {
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutDevis | 'tous'>('tous')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    return devis
      .filter(d => {
        const q = search.toLowerCase()
        const nom = d.demande?.nom_prospect ?? ''
        const dep = d.demande?.depart ?? ''
        const dest = d.demande?.destination ?? ''
        const matchSearch = !q || nom.toLowerCase().includes(q) || dep.toLowerCase().includes(q) || dest.toLowerCase().includes(q)
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
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40, color: '#94a3b8' }}>
          <IconSearch />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client, trajet..."
            style={{ flex: 1, fontSize: 13, color: '#0f172a', border: 'none', outline: 'none', background: 'transparent' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40, color: '#94a3b8' }}>
          <IconFilter />
          <select
            value={statut}
            onChange={e => setStatut(e.target.value as StatutDevis | 'tous')}
            style={{ fontSize: 13, color: '#475569', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <option value="tous">Tous les statuts</option>
            {(Object.keys(STATUT_CONFIG) as StatutDevis[]).map(s => (
              <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, height: 40, padding: '0 14px', fontSize: 13, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {sort === 'desc'
              ? <><path d="M3 16l4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h10M11 8h7M11 12h4"/></>
              : <><path d="M3 8l4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h10M11 16h7M11 20h4"/></>
            }
          </svg>
          {sort === 'desc' ? 'Plus récents' : 'Plus anciens'}
        </button>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ marginBottom: 12, color: '#cbd5e1', display: 'flex', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', margin: '0 0 6px' }}>Aucun devis trouvé</p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Les devis générés par l&apos;IA apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(d => {
            const cfg = STATUT_CONFIG[d.statut]
            const exp = expiration(d.envoye_le)
            const expiringSoon = exp && exp.daysLeft >= 0 && exp.daysLeft <= 2 && d.statut === 'envoye'
            const nom = d.demande?.nom_prospect ?? '—'

            return (
              <div
                key={d.id}
                style={{
                  background: 'white',
                  border: '1.5px solid #f1f5f9',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 0.15s',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#f1f5f9'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                {/* Accent gauche statut */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '14px 0 0 14px', background: cfg.dot }} />

                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: cfg.color, flexShrink: 0 }}>
                  {initials(nom)}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {d.demande?.depart && d.demande?.destination ? (
                      <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {d.demande.depart}
                        <IconArrowRight />
                        {d.demande.destination}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Trajet non précisé</span>
                    )}
                    <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(d.created_at)}</span>
                  </div>
                </div>

                {/* Montant */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{fmtMontant(d.prix_ttc)}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    {d.envoye_le ? `Envoyé le ${fmt(d.envoye_le)}` : 'Non envoyé'}
                  </p>
                </div>

                {/* Expiration */}
                {exp && d.statut === 'envoye' && (
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: expiringSoon ? '#ea580c' : '#94a3b8', margin: '0 0 2px', fontWeight: expiringSoon ? 600 : 400 }}>
                      expire {exp.label}
                    </p>
                    {expiringSoon && (
                      <p style={{ fontSize: 10, color: '#ea580c', margin: 0 }}>J-{exp.daysLeft}</p>
                    )}
                  </div>
                )}

                {/* Statut badge */}
                <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {cfg.label}
                </span>

                {/* PDF */}
                {d.pdf_url && (
                  <a
                    href={d.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', flexShrink: 0, textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2563eb'; (e.currentTarget as HTMLAnchorElement).style.color = '#2563eb' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLAnchorElement).style.color = '#64748b' }}
                    title="Voir le PDF"
                  >
                    <IconFile />
                  </a>
                )}

                <IconChevron />
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 10 }}>
          {filtered.length} devis
        </p>
      )}
    </>
  )
}
