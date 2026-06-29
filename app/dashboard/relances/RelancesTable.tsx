'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type TypeRelance = 'relance_1' | 'relance_2'
type StatutRelance = 'programmee' | 'envoyee' | 'echec'

export interface RelanceRow {
  id: string
  type: TypeRelance
  date_programmee: string
  envoyee_le: string | null
  statut: StatutRelance
  created_at: string
  demande: { nom_prospect: string; statut: string } | null
}

const PAGE_SIZE = 15

function computeDisplayStatut(r: RelanceRow) {
  if (r.demande?.statut === 'accepte' || r.demande?.statut === 'refuse')
    return { label: 'Répondu', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' }
  if (r.statut === 'echec')
    return { label: 'Échec', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' }
  if (r.statut === 'envoyee')
    return { label: 'Envoyée', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' }
  const isPast = new Date(r.date_programmee) < new Date()
  if (isPast)
    return { label: 'En retard', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#ef4444' }
  return { label: 'Programmée', color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' }
}

const TYPE_CONFIG: Record<TypeRelance, { label: string; color: string; bg: string; border: string }> = {
  relance_1: { label: 'Relance 1', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  relance_2: { label: 'Relance 2', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function fmtFull(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysFromNow(d: string) {
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff === 0) return "aujourd'hui"
  if (diff === 1) return 'demain'
  if (diff === -1) return 'hier'
  if (diff < 0) return `il y a ${Math.abs(diff)}j`
  return `dans ${diff}j`
}

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)
const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
)
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)

// ── Bouton déclenchement manuel ───────────────────────────

function BoutonDeclencher() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ relance_1: number; relance_2: number; clotures: number; erreurs: string[] } | null>(null)

  const declencher = async () => {
    setState('loading')
    setResult(null)
    try {
      const res = await fetch('/api/relances/declencher', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setResult(data)
      setState('success')
      router.refresh()
      setTimeout(() => setState('idle'), 8000)
    } catch (e) {
      setState('error')
      setTimeout(() => setState('idle'), 5000)
      console.error(e)
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Bandeau démo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fefce8', border: '1.5px solid #fde047', borderRadius: 12, padding: '12px 16px', marginBottom: result ? 10 : 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#713f12' }}>Mode démo actif</p>
          <p style={{ margin: 0, fontSize: 11, color: '#854d0e' }}>Délais réduits à 2 minutes (prod : J+2 / J+3 / J+2)</p>
        </div>
        <button
          onClick={declencher}
          disabled={state === 'loading'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: state === 'loading' ? '#e2e8f0' : '#1a2138',
            color: state === 'loading' ? '#94a3b8' : 'white',
            border: 'none', borderRadius: 8, padding: '8px 16px',
            fontSize: 12, fontWeight: 600, cursor: state === 'loading' ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
        >
          {state === 'loading' ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Envoi en cours…
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Déclencher les relances
            </>
          )}
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>

      {/* Résultat */}
      {result && state === 'success' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Relance 1', val: result.relance_1, color: '#7c3aed' },
            { label: 'Relance 2', val: result.relance_2, color: '#ea580c' },
            { label: 'Clôturés',  val: result.clotures,  color: '#6b7280' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 8, padding: '6px 12px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: val > 0 ? color : '#94a3b8' }}>{val}</span>
            </div>
          ))}
          {result.erreurs.length > 0 && (
            <div style={{ fontSize: 11, color: '#dc2626', padding: '6px 12px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 8 }}>
              {result.erreurs.length} erreur(s)
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? '#cbd5e1' : '#475569' }}
        >
          <IconChevronLeft />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) => p === '...'
            ? <span key={`ellipsis-${i}`} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>…</span>
            : <button key={p} onClick={() => onChange(p as number)} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid', borderColor: page === p ? '#2563eb' : '#e2e8f0', background: page === p ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: page === p ? 600 : 400, color: page === p ? '#2563eb' : '#475569' }}>{p}</button>
          )
        }
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === totalPages ? '#cbd5e1' : '#475569' }}
        >
          <IconChevronRight />
        </button>
      </div>
    </div>
  )
}

export default function RelancesTable({ relances }: { relances: RelanceRow[] }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TypeRelance | 'tous'>('tous')
  const [statut, setStatut] = useState<'tous' | 'envoyee' | 'programmee' | 'reponse' | 'retard'>('tous')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    setPage(1)
    return relances.filter(r => {
      const q = search.toLowerCase()
      const nom = r.demande?.nom_prospect ?? ''
      const matchSearch = !q || nom.toLowerCase().includes(q)
      const matchType = type === 'tous' || r.type === type
      if (!matchSearch || !matchType) return false
      if (statut === 'tous') return true
      const d = computeDisplayStatut(r)
      if (statut === 'envoyee')    return d.label === 'Envoyée'
      if (statut === 'programmee') return d.label === 'Programmée'
      if (statut === 'reponse')    return d.label === 'Répondu'
      if (statut === 'retard')     return d.label === 'En retard'
      return true
    }).sort((a, b) => new Date(b.date_programmee).getTime() - new Date(a.date_programmee).getTime())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relances, search, type, statut])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <BoutonDeclencher />

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40, color: '#94a3b8' }}>
          <IconSearch />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un prospect..."
            style={{ flex: 1, fontSize: 13, color: '#0f172a', border: 'none', outline: 'none', background: 'transparent' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40, color: '#94a3b8' }}>
          <IconFilter />
          <select value={type} onChange={e => setType(e.target.value as TypeRelance | 'tous')}
            style={{ fontSize: 13, color: '#475569', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}>
            <option value="tous">Tous les types</option>
            <option value="relance_1">Relance 1</option>
            <option value="relance_2">Relance 2</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40, color: '#94a3b8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <select value={statut} onChange={e => setStatut(e.target.value as typeof statut)}
            style={{ fontSize: 13, color: '#475569', border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer' }}>
            <option value="tous">Tous les statuts</option>
            <option value="programmee">Programmée</option>
            <option value="envoyee">Envoyée</option>
            <option value="reponse">Répondu</option>
            <option value="retard">En retard</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ marginBottom: 12, color: '#cbd5e1', display: 'flex', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', margin: '0 0 6px' }}>Aucune relance trouvée</p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Les relances automatiques apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {paginated.map(r => {
            const display = computeDisplayStatut(r)
            const typeCfg = TYPE_CONFIG[r.type]
            const nom = r.demande?.nom_prospect ?? '—'
            const isPast = r.statut === 'programmee' && new Date(r.date_programmee) < new Date()

            return (
              <div
                key={r.id}
                style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#f1f5f9'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                {/* Barre gauche */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '14px 0 0 14px', background: display.dot }} />

                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: typeCfg.bg, border: `1.5px solid ${typeCfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: typeCfg.color, flexShrink: 0 }}>
                  {initials(nom)}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</p>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: typeCfg.bg, color: typeCfg.color, border: `1px solid ${typeCfg.border}`, flexShrink: 0 }}>
                      {typeCfg.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style={{ fontSize: 12, color: isPast ? '#dc2626' : '#64748b', fontWeight: isPast ? 600 : 400 }}>
                      {fmtFull(r.date_programmee)} · {daysFromNow(r.date_programmee)}
                    </span>
                    {r.envoyee_le && (
                      <>
                        <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Envoyée le {fmt(r.envoyee_le)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Statut */}
                <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: display.bg, color: display.color, border: `1px solid ${display.border}`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {display.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </>
  )
}
