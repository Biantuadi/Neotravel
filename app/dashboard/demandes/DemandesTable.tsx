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

const URGENCE_CONFIG: Record<Urgence, { label: string; bg: string; text: string; dot: string }> = {
  faible:   { label: 'Faible',  bg: 'bg-[rgba(112,122,140,0.12)]', text: 'text-[#707a8c]', dot: 'bg-[#707a8c]' },
  normale:  { label: 'Normal',  bg: 'bg-[rgba(112,122,140,0.12)]', text: 'text-[#707a8c]', dot: 'bg-[#707a8c]' },
  urgente:  { label: 'Urgent',  bg: 'bg-[rgba(242,156,18,0.12)]',  text: 'text-[#f29c12]', dot: 'bg-[#f29c12]' },
}

const STATUT_CONFIG: Record<Statut, { label: string; bg: string; text: string }> = {
  nouveau_lead: { label: 'Nouvelle',     bg: 'bg-[rgba(51,107,199,0.12)]',  text: 'text-[#336bc7]' },
  incomplet:    { label: 'Incomplète',   bg: 'bg-[rgba(242,156,18,0.12)]',  text: 'text-[#f29c12]' },
  qualifie:     { label: 'Qualifiée',    bg: 'bg-[rgba(76,175,80,0.12)]',   text: 'text-[#4caf50]' },
  devis_envoye: { label: 'Devis envoyé', bg: 'bg-[rgba(51,107,199,0.12)]',  text: 'text-[#336bc7]' },
  relance_1:    { label: 'Relance 1',    bg: 'bg-[rgba(242,156,18,0.12)]',  text: 'text-[#f29c12]' },
  relance_2:    { label: 'Relance 2',    bg: 'bg-[rgba(242,156,18,0.12)]',  text: 'text-[#ed8f1a]' },
  accepte:      { label: 'Acceptée',     bg: 'bg-[rgba(46,125,50,0.12)]',   text: 'text-[#2e7d32]' },
  refuse:       { label: 'Refusée',      bg: 'bg-[rgba(229,57,53,0.12)]',   text: 'text-[#e53935]' },
  cas_complexe: { label: 'Cas complexe', bg: 'bg-[rgba(124,58,237,0.12)]',  text: 'text-[#7c3aed]' },
  cloture:      { label: 'Clôturée',     bg: 'bg-[rgba(112,122,140,0.12)]', text: 'text-[#707a8c]' },
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

function Badge({ config }: { config: { label: string; bg: string; text: string } }) {
  return (
    <span className={`inline-flex items-center px-3 h-6 rounded-full text-[11px] font-medium ${config.bg} ${config.text} whitespace-nowrap`}>
      {config.label}
    </span>
  )
}

function formatDate(d: string | null, full = false) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', full
    ? { day: '2-digit', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: '2-digit' }
  )
}

// ── Drawer détail demande ─────────────────────────────────

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

  async function handleSendEmail() {
    setSendingEmail(true)
    setEmailError('')
    try {
      const res = await fetch(`/api/demandes/${demande.id}/email`, { method: 'POST' })
      if (res.ok) {
        setEmailSent(true)
        setTimeout(() => setEmailSent(false), 3000)
      } else {
        const body = await res.json()
        setEmailError(body.error ?? 'Erreur envoi')
      }
    } finally {
      setSendingEmail(false)
    }
  }

  const transitions = STATUT_TRANSITIONS[demande.statut]

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/demandes/${demande.id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: selectedStatut, note }),
      })
      if (res.ok) {
        onStatutChange(demande.id, selectedStatut, note)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const changed = selectedStatut !== demande.statut || note !== (demande.note_commerciale ?? '')

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8eaed]">
          <div>
            <p className="text-[15px] font-bold text-[#12151a]">{demande.nom_prospect}</p>
            <p className="text-[11px] text-[#707a8c]">Demande #{demande.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f5f7fa] flex items-center justify-center text-[#707a8c] hover:bg-[#e8eaed] transition-colors text-[18px]">
            ×
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Statuts actuels */}
          <div className="flex gap-2 flex-wrap">
            <Badge config={STATUT_CONFIG[demande.statut]} />
            <Badge config={URGENCE_CONFIG[demande.urgence]} />
          </div>

          {/* Infos trajet */}
          <Section title="Trajet">
            <Row label="Départ"       value={demande.depart ?? '—'} />
            <Row label="Destination"  value={demande.destination ?? '—'} />
            <Row label="Date départ"  value={formatDate(demande.date_depart, true)} />
            <Row label="Passagers"    value={demande.nb_passagers ? `${demande.nb_passagers} pers.` : '—'} />
          </Section>

          {/* Infos contact */}
          <Section title="Contact">
            <Row label="Nom"       value={demande.nom_prospect} />
            <Row label="Email"     value={demande.email ?? '—'} link={demande.email ? `mailto:${demande.email}` : undefined} />
            <Row label="Téléphone" value={demande.telephone ?? '—'} link={demande.telephone ? `tel:${demande.telephone}` : undefined} />
            <Row label="Créée le"  value={formatDate(demande.date_creation, true)} />
          </Section>

          {/* Changer le statut */}
          {transitions.length > 0 && (
            <Section title="Changer le statut">
              <div className="flex flex-wrap gap-2 mt-1">
                {transitions.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatut(s)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                      selectedStatut === s
                        ? `${STATUT_CONFIG[s].bg} ${STATUT_CONFIG[s].text} border-current`
                        : 'bg-white border-[#e0e2e6] text-[#707a8c] hover:border-[#336bc7] hover:text-[#336bc7]'
                    }`}
                  >
                    {STATUT_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Note commerciale */}
          <Section title="Note interne">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ajouter une note pour l'équipe (ex : client rappelé le 30/06, en attente de confirmation...)"
              rows={4}
              className="w-full mt-1 text-[12px] text-[#12151a] placeholder:text-[#9ca3af] border border-[#e0e2e6] rounded-[8px] p-3 outline-none focus:border-[#336bc7] resize-none"
            />
          </Section>

          {/* Actions rapides */}
          <Section title="Actions rapides">
            <div className="flex flex-col gap-2 mt-1">
              {demande.email && (
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#f5f7fa] text-[12px] text-[#12151a] hover:bg-[#e8eaed] transition-colors disabled:opacity-50 w-full text-left"
                >
                  <span>✉</span>
                  {sendingEmail ? 'Envoi...' : emailSent ? '✓ Email envoyé' : 'Envoyer un email de suivi'}
                </button>
              )}
              {emailError && (
                <p className="text-[11px] text-[#e53935] px-1">{emailError}</p>
              )}
              {demande.telephone && (
                <a
                  href={`tel:${demande.telephone}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#f5f7fa] text-[12px] text-[#12151a] hover:bg-[#e8eaed] transition-colors"
                >
                  <span>📞</span> Appeler le prospect
                </a>
              )}
              {demande.statut === 'cas_complexe' && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[rgba(124,58,237,0.08)] text-[12px] text-[#7c3aed]">
                  <span>⚠</span> Cas complexe — traitement manuel requis
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Footer sticky */}
        <div className="px-6 py-4 border-t border-[#e8eaed] bg-white">
          {saved && (
            <p className="text-[12px] text-[#4caf50] text-center mb-2">✓ Modifications enregistrées</p>
          )}
          <button
            onClick={handleSave}
            disabled={!changed || saving}
            className={`w-full h-10 rounded-[8px] text-[13px] font-semibold transition-all ${
              changed && !saving
                ? 'bg-[#336bc7] text-white hover:bg-[#2558b0]'
                : 'bg-[#f5f7fa] text-[#9ca3af] cursor-not-allowed'
            }`}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#707a8c] uppercase tracking-wider mb-2">{title}</p>
      <div className="bg-[#f9fafb] rounded-[10px] px-4 py-3 space-y-2">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-[#9ca3af] shrink-0">{label}</span>
      {link ? (
        <a href={link} className="text-[12px] text-[#336bc7] hover:underline truncate text-right">{value}</a>
      ) : (
        <span className="text-[12px] text-[#12151a] truncate text-right">{value}</span>
      )}
    </div>
  )
}

// ── Table principale ──────────────────────────────────────

export default function DemandesTable({ demandes: initialDemandes }: { demandes: Demande[] }) {
  const [demandes, setDemandes] = useState(initialDemandes)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<Statut | 'tous'>('tous')
  const [urgenceFilter, setUrgenceFilter] = useState<Urgence | 'tous'>('tous')
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
        <div className="bg-[#f5f7fa] rounded-[8px] h-10 grid grid-cols-[1fr_1fr_80px_80px_110px_110px] items-center px-4 mb-1">
          {['CLIENT', 'TRAJET', 'DATE', 'PASS.', 'URGENCE', 'STATUT'].map(col => (
            <p key={col} className="text-[11px] font-semibold text-[#707a8c]">{col}</p>
          ))}
        </div>

        <div className="space-y-1">
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#e0e2e6] rounded-[8px] py-8 text-center text-[13px] text-[#707a8c]">
              Aucune demande trouvée
            </div>
          ) : filtered.map(d => (
            <div
              key={d.id}
              onClick={() => setSelected(d)}
              className="bg-white border border-[#e0e2e6] rounded-[8px] h-12 grid grid-cols-[1fr_1fr_80px_80px_110px_110px] items-center px-4 hover:bg-[#fafbfc] hover:border-[#336bc7] transition-all cursor-pointer group"
            >
              <p className="text-[12px] text-[#12151a] truncate pr-2 font-medium">{d.nom_prospect}</p>
              <p className="text-[12px] text-[#707a8c] truncate pr-2">
                {d.depart && d.destination ? `${d.depart} → ${d.destination}` : d.depart ?? '—'}
              </p>
              <p className="text-[12px] text-[#707a8c]">{formatDate(d.date_depart)}</p>
              <p className="text-[12px] text-[#707a8c]">{d.nb_passagers ?? '—'}</p>
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
          <div
            key={d.id}
            onClick={() => setSelected(d)}
            className="bg-white border border-[#e0e2e6] rounded-xl p-4 cursor-pointer active:bg-[#f5f7fa]"
          >
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

      {/* Drawer */}
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
