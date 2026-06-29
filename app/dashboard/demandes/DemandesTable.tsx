'use client'

import { useState, useMemo } from 'react'

type Urgence = 'faible' | 'normale' | 'urgente'
type Statut =
  | 'nouveau_lead' | 'incomplet' | 'qualifie' | 'devis_envoye'
  | 'relance_1' | 'relance_2' | 'accepte' | 'refuse' | 'cas_complexe' | 'cloture'

export interface Demande {
  id: string
  nom_prospect: string
  email?: string | null
  telephone?: string | null
  depart: string | null
  destination: string | null
  date_depart: string | null
  nb_passagers: number | null
  urgence: Urgence
  statut: Statut
  date_creation: string
  note_commerciale?: string | null
}

const STATUT_CONFIG: Record<Statut, { label: string; color: string; bg: string; border: string }> = {
  nouveau_lead: { label: 'Nouveau',      color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  incomplet:    { label: 'Incomplet',    color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  qualifie:     { label: 'Qualifié',     color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  devis_envoye: { label: 'Devis envoyé', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  relance_1:    { label: 'Relance 1',    color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  relance_2:    { label: 'Relance 2',    color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  accepte:      { label: 'Accepté',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  refuse:       { label: 'Refusé',       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  cas_complexe: { label: 'Transféré',    color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  cloture:      { label: 'Clôturé',      color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const URGENCE_BAR: Record<Urgence, string> = {
  faible:  '#e5e7eb',
  normale: '#93c5fd',
  urgente: '#f97316',
}

const STATUT_TRANSITIONS: Record<Statut, Statut[]> = {
  nouveau_lead: ['qualifie', 'incomplet', 'cas_complexe', 'cloture'],
  incomplet:    ['qualifie', 'cas_complexe', 'cloture'],
  qualifie:     ['devis_envoye', 'cas_complexe', 'cloture'],
  devis_envoye: ['relance_1', 'accepte', 'refuse', 'cloture'],
  relance_1:    ['relance_2', 'accepte', 'refuse', 'cloture'],
  relance_2:    ['accepte', 'refuse', 'cloture'],
  accepte:      ['cloture'],
  refuse:       ['cloture'],
  cas_complexe: ['qualifie', 'devis_envoye', 'accepte', 'refuse', 'cloture'],
  cloture:      [],
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(d: string | null, full = false) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', full
    ? { day: '2-digit', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: '2-digit' }
  )
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'à l\'instant'
  if (h < 24) return `il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days === 1) return 'hier'
  return `il y a ${days}j`
}

// ── Drawer ─────────────────────────────────────────────────

function DemandeDrawer({
  demande,
  onClose,
  onStatutChange,
}: {
  demande: Demande
  onClose: () => void
  onStatutChange: (id: string, statut: Statut, note?: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [note, setNote] = useState(demande.note_commerciale ?? '')
  const [selectedStatut, setSelectedStatut] = useState<Statut>(demande.statut)
  const [saved, setSaved] = useState(false)
  const cfg = STATUT_CONFIG[selectedStatut]
  const transitions = STATUT_TRANSITIONS[demande.statut]
  const changed = selectedStatut !== demande.statut || note !== (demande.note_commerciale ?? '')

  async function handleSendEmail() {
    setSendingEmail(true); setEmailError('')
    try {
      const res = await fetch(`/api/demandes/${demande.id}/email`, { method: 'POST' })
      if (res.ok) { setEmailSent(true); setTimeout(() => setEmailSent(false), 3000) }
      else { const b = await res.json(); setEmailError(b.error ?? 'Erreur envoi') }
    } finally { setSendingEmail(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/demandes/${demande.id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: selectedStatut, note }),
      })
      if (res.ok) { onStatutChange(demande.id, selectedStatut, note); setSaved(true); setTimeout(() => setSaved(false), 2000) }
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 flex flex-col" style={{ width: 480, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: cfg.color, flexShrink: 0 }}>
                {initials(demande.nom_prospect)}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>{demande.nom_prospect}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>#{demande.id.slice(0, 8)} · {timeAgo(demande.date_creation)}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: 18, flexShrink: 0 }}>×</button>
          </div>

          {/* Statut pill + urgence */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
              {cfg.label}
            </span>
            {demande.urgence === 'urgente' && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                URGENT
              </span>
            )}
            {demande.depart && demande.destination && (
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>{demande.depart} → {demande.destination}</span>
            )}
          </div>
        </div>

        {/* Scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Infos trajet */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Trajet</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Départ', value: demande.depart ?? '—' },
                { label: 'Destination', value: demande.destination ?? '—' },
                { label: 'Date', value: formatDate(demande.date_depart, true) },
                { label: 'Passagers', value: demande.nb_passagers ? `${demande.nb_passagers} pers.` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 3px' }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Contact</p>
            <div style={{ background: '#f8fafc', borderRadius: 10, overflow: 'hidden' }}>
              {[
                { icon: '✉', label: 'Email', value: demande.email, href: demande.email ? `mailto:${demande.email}` : undefined },
                { icon: '☎', label: 'Téléphone', value: demande.telephone, href: demande.telephone ? `tel:${demande.telephone}` : undefined },
              ].map(({ icon, label, value, href }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 14, width: 20, textAlign: 'center', color: '#94a3b8' }}>{icon}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 80 }}>{label}</span>
                  {href
                    ? <a href={href} style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>{value}</a>
                    : <span style={{ fontSize: 13, color: '#0f172a' }}>{value ?? '—'}</span>
                  }
                </div>
              ))}
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center', color: '#94a3b8' }}>📅</span>
                <span style={{ fontSize: 12, color: '#94a3b8', width: 80 }}>Créée</span>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{formatDate(demande.date_creation, true)}</span>
              </div>
            </div>
          </div>

          {/* Changer statut */}
          {transitions.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Changer le statut</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {transitions.map(s => {
                  const c = STATUT_CONFIG[s]
                  const active = selectedStatut === s
                  return (
                    <button
                      key={s}
                      onClick={() => setSelectedStatut(s)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: active ? c.bg : 'white',
                        color: active ? c.color : '#64748b',
                        border: active ? `1.5px solid ${c.color}` : '1.5px solid #e2e8f0',
                      }}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Note interne</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex : client rappelé le 29/06, en attente de confirmation budget..."
              rows={4}
              style={{ width: '100%', boxSizing: 'border-box', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#0f172a', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
            />
          </div>

          {/* Actions */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Actions rapides</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {demande.email && (
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: emailSent ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: 13, color: emailSent ? '#16a34a' : '#0f172a', transition: 'all 0.15s', opacity: sendingEmail ? 0.6 : 1 }}
                >
                  <span style={{ fontSize: 15 }}>{emailSent ? '✓' : '✉'}</span>
                  {sendingEmail ? 'Envoi en cours...' : emailSent ? 'Email envoyé !' : 'Envoyer un email de suivi'}
                </button>
              )}
              {emailError && <p style={{ fontSize: 12, color: '#dc2626', margin: '2px 0 0 4px' }}>{emailError}</p>}
              {demande.telephone && (
                <a href={`tel:${demande.telephone}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 13, color: '#0f172a', textDecoration: 'none' }}>
                  <span style={{ fontSize: 15 }}>☎</span> Appeler le prospect
                </a>
              )}
              {demande.statut === 'cas_complexe' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: '#faf5ff', border: '1.5px solid #e9d5ff', fontSize: 13, color: '#7c3aed' }}>
                  <span>⚡</span> Cas complexe — traitement manuel requis
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
          {saved && <p style={{ fontSize: 12, color: '#16a34a', textAlign: 'center', marginBottom: 8 }}>✓ Modifications enregistrées</p>}
          <button
            onClick={handleSave}
            disabled={!changed || saving}
            style={{
              width: '100%', height: 42, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: changed ? 'pointer' : 'not-allowed', transition: 'all 0.15s', border: 'none',
              background: changed && !saving ? '#2563eb' : '#f1f5f9',
              color: changed && !saving ? 'white' : '#94a3b8',
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Table principale ──────────────────────────────────────

export default function DemandesTable({ demandes: initialDemandes }: { demandes: Demande[] }) {
  const [demandes, setDemandes] = useState(initialDemandes)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<Statut | 'tous'>('tous')
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<Demande | null>(null)

  function handleStatutChange(id: string, statut: Statut, note?: string) {
    setDemandes(prev => prev.map(d =>
      d.id === id ? { ...d, statut, note_commerciale: note ?? d.note_commerciale } : d
    ))
    setSelected(prev => prev?.id === id ? { ...prev, statut, note_commerciale: note ?? prev.note_commerciale } : prev)
  }

  const filtered = useMemo(() => {
    return demandes
      .filter(d => {
        const q = search.toLowerCase()
        const match = !q || d.nom_prospect.toLowerCase().includes(q) || (d.depart ?? '').toLowerCase().includes(q) || (d.destination ?? '').toLowerCase().includes(q)
        const matchStatut = statutFilter === 'tous' || d.statut === statutFilter
        return match && matchStatut
      })
      .sort((a, b) => {
        const da = new Date(a.date_creation).getTime()
        const db = new Date(b.date_creation).getTime()
        return sort === 'desc' ? db - da : da - db
      })
  }, [demandes, search, statutFilter, sort])

  return (
    <>
      {/* Barre de filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '0 12px', height: 40 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un prospect, trajet..."
            style={{ flex: 1, fontSize: 13, color: '#0f172a', border: 'none', outline: 'none', background: 'transparent' }}
          />
        </div>

        <select
          value={statutFilter}
          onChange={e => setStatutFilter(e.target.value as Statut | 'tous')}
          style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, height: 40, padding: '0 12px', fontSize: 13, color: '#475569', outline: 'none', cursor: 'pointer' }}
        >
          <option value="tous">Tous les statuts</option>
          {(Object.keys(STATUT_CONFIG) as Statut[]).map(s => (
            <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
          ))}
        </select>

        <button
          onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
          style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 10, height: 40, padding: '0 14px', fontSize: 13, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
          {sort === 'desc' ? 'Plus récentes' : 'Plus anciennes'}
        </button>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', margin: '0 0 6px' }}>Aucun cas transféré</p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Les demandes escaladées par l&apos;IA apparaîtront ici.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(d => {
            const cfg = STATUT_CONFIG[d.statut]
            const isUrgent = d.urgence === 'urgente'
            return (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                style={{
                  background: 'white',
                  border: `1.5px solid ${selected?.id === d.id ? '#2563eb' : '#f1f5f9'}`,
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2563eb'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(37,99,235,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = selected?.id === d.id ? '#2563eb' : '#f1f5f9'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                {/* Barre urgence gauche */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '14px 0 0 14px', background: URGENCE_BAR[d.urgence] }} />

                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: cfg.color, flexShrink: 0 }}>
                  {initials(d.nom_prospect)}
                </div>

                {/* Infos principales */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nom_prospect}</p>
                    {isUrgent && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', flexShrink: 0 }}>URGENT</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {d.depart && d.destination ? (
                      <span style={{ fontSize: 12, color: '#64748b' }}>{d.depart} → {d.destination}</span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Trajet non précisé</span>
                    )}
                    {d.nb_passagers && (
                      <>
                        <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{d.nb_passagers} pers.</span>
                      </>
                    )}
                    {d.date_depart && (
                      <>
                        <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(d.date_depart)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Droite : statut + date */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(d.date_creation)}</span>
                </div>

                {/* Flèche */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 10 }}>
          {filtered.length} cas transféré{filtered.length > 1 ? 's' : ''}
        </p>
      )}

      {selected && (
        <DemandeDrawer
          demande={selected}
          onClose={() => setSelected(null)}
          onStatutChange={handleStatutChange}
        />
      )}
    </>
  )
}
