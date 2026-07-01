'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const PAGE_SIZE = 15

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

function fmt(date: string | null, long = false) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', long
    ? { day: '2-digit', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: '2-digit' }
  )
}

function fmtMontant(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function expiration(envoye_le: string | null) {
  if (!envoye_le) return null
  const d = new Date(envoye_le)
  d.setDate(d.getDate() + 7)
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000)
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
const IconArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconExternalLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? '#cbd5e1' : '#475569' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).reduce<(number | '...')[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...'); acc.push(p); return acc }, []).map((p, i) =>
          p === '...' ? <span key={`e${i}`} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>…</span>
          : <button key={p} onClick={() => onChange(p as number)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid', borderColor: page === p ? '#2563eb' : '#e2e8f0', background: page === p ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 600 : 400, color: page === p ? '#2563eb' : '#475569' }}>{p}</button>
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? '#cbd5e1' : '#475569' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  )
}

// Transitions autorisées par statut courant
const TRANSITIONS: Record<StatutDevis, StatutDevis[]> = {
  brouillon: ['envoye'],
  envoye:    ['accepte', 'refuse'],
  accepte:   [],
  refuse:    ['envoye'],
  expire:    ['envoye', 'refuse'],
}

const TRANSITION_LABEL: Record<StatutDevis, string> = {
  brouillon: 'Marquer envoyé',
  envoye:    'Marquer envoyé',
  accepte:   'Signé ✓',
  refuse:    'Marquer refusé',
  expire:    'Marquer expiré',
}

const TRANSITION_COLOR: Record<StatutDevis, string> = {
  brouillon: '#2563eb',
  envoye:    '#2563eb',
  accepte:   '#16a34a',
  refuse:    '#dc2626',
  expire:    '#9ca3af',
}

// ── Drawer détail devis ───────────────────────────────────

function DevisDrawer({ devis: initialDevis, onClose, onStatutChange }: { devis: DevisRow; onClose: () => void; onStatutChange: (id: string, s: StatutDevis) => void }) {
  const [devis, setDevis] = useState(initialDevis)
  const [updating, setUpdating] = useState(false)
  const cfg = STATUT_CONFIG[devis.statut]
  const exp = expiration(devis.envoye_le)
  const nom = devis.demande?.nom_prospect ?? '—'
  const transitions = TRANSITIONS[devis.statut]

  const changeStatut = useCallback(async (newStatut: StatutDevis) => {
    setUpdating(true)
    try {
      await fetch(`/api/devis/${devis.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      })
      const updated = { ...devis, statut: newStatut }
      if (newStatut === 'envoye' && !devis.envoye_le) updated.envoye_le = new Date().toISOString()
      setDevis(updated)
      onStatutChange(devis.id, newStatut)
    } finally {
      setUpdating(false)
    }
  }, [devis, onStatutChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)', zIndex: 40 }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 440,
        background: 'white', zIndex: 50, overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        animation: 'slideIn 0.2s ease',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: cfg.color }}>
              {initials(nom)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{nom}</p>
              <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {cfg.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <IconX />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Montant */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', textAlign: 'center', border: '1.5px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#94a3b8' }}>Montant TTC</p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{fmtMontant(devis.prix_ttc)}</p>
          </div>

          {/* Trajet */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Trajet</p>
            {devis.demande?.depart && devis.demande?.destination ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1.5px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{devis.demande.depart}</span>
                <IconArrowRight />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{devis.demande.destination}</span>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Trajet non précisé</p>
            )}
          </div>

          {/* Dates */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Dates</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Créé le', value: fmt(devis.created_at, true) },
                { label: 'Envoyé le', value: fmt(devis.envoye_le, true) },
                ...(exp ? [{ label: 'Expire le', value: `${fmt(devis.envoye_le ? new Date(new Date(devis.envoye_le).getTime() + 7 * 86400000).toISOString() : null, true)} (J${exp.daysLeft >= 0 ? '-' + exp.daysLeft : '+' + Math.abs(exp.daysLeft)})` }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Statut + changement */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Statut</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: cfg.bg, borderRadius: 10, padding: '10px 14px', border: `1.5px solid ${cfg.border}`, marginBottom: transitions.length > 0 ? 10 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
            </div>

            {transitions.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {transitions.map(s => (
                  <button
                    key={s}
                    onClick={() => changeStatut(s)}
                    disabled={updating}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${TRANSITION_COLOR[s]}20`,
                      background: `${TRANSITION_COLOR[s]}10`, color: TRANSITION_COLOR[s],
                      fontSize: 12, fontWeight: 600, cursor: updating ? 'not-allowed' : 'pointer',
                      opacity: updating ? 0.6 : 1, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!updating) (e.currentTarget as HTMLButtonElement).style.background = `${TRANSITION_COLOR[s]}20` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${TRANSITION_COLOR[s]}10` }}
                  >
                    {STATUT_CONFIG[s].label === 'Signé' ? '✓ Marquer signé' : `→ ${STATUT_CONFIG[s].label}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {devis.pdf_url && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Actions</p>
              <a
                href={devis.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 500, color: '#0f172a', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2563eb'; (e.currentTarget as HTMLAnchorElement).style.color = '#2563eb' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLAnchorElement).style.color = '#0f172a' }}
              >
                <IconFile />
                Voir le devis PDF
                <span style={{ marginLeft: 'auto' }}><IconExternalLink /></span>
              </a>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

// ── Table principale ──────────────────────────────────────

export default function DevisTable({ devis: initialDevis }: { devis: DevisRow[] }) {
  const router = useRouter()
  const [devis, setDevis] = useState(initialDevis)

  useEffect(() => {
    setDevis(initialDevis)
  }, [initialDevis])
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutDevis | 'tous'>('tous')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<DevisRow | null>(null)

  const handleStatutChange = useCallback((id: string, newStatut: StatutDevis) => {
    setDevis(prev => prev.map(d => d.id === id ? { ...d, statut: newStatut } : d))
    setSelected(prev => prev?.id === id ? { ...prev, statut: newStatut } : prev)
    router.refresh()
  }, [router])

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

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1) }, [search, statut, sort])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', margin: '0 0 6px' }}>Aucun devis trouvé</p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Les devis générés par l&apos;IA apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {paginated.map(d => {
            const cfg = STATUT_CONFIG[d.statut]
            const exp = expiration(d.envoye_le)
            const expiringSoon = exp && exp.daysLeft >= 0 && exp.daysLeft <= 2 && d.statut === 'envoye'
            const nom = d.demande?.nom_prospect ?? '—'

            return (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                style={{
                  background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 14,
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.15s', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#f1f5f9'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '14px 0 0 14px', background: cfg.dot }} />

                <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: cfg.color, flexShrink: 0 }}>
                  {initials(nom)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {d.demande?.depart && d.demande?.destination ? (
                      <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {d.demande.depart} <IconArrowRight /> {d.demande.destination}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Trajet non précisé</span>
                    )}
                    <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(d.created_at)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{fmtMontant(d.prix_ttc)}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                    {d.envoye_le ? `Envoyé le ${fmt(d.envoye_le)}` : 'Non envoyé'}
                  </p>
                </div>

                {exp && d.statut === 'envoye' && (
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: expiringSoon ? '#ea580c' : '#94a3b8', margin: '0 0 2px', fontWeight: expiringSoon ? 600 : 400 }}>expire {exp.label}</p>
                    {expiringSoon && <p style={{ fontSize: 10, color: '#ea580c', margin: 0 }}>J-{exp.daysLeft}</p>}
                  </div>
                )}

                <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {cfg.label}
                </span>

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

                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />

      {selected && <DevisDrawer devis={selected} onClose={() => setSelected(null)} onStatutChange={handleStatutChange} />}
    </>
  )
}
