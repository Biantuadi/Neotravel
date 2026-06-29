import type { Metadata } from 'next'
import { getDashboardData } from '@/lib/dashboard-data'
import { ActivityChart, StatutsDonut, PipelineBar, GaugeRing } from '@/components/dashboard/Charts'

export const metadata: Metadata = { title: 'NeoTravel — Tableau de bord' }
export const revalidate = 60

// ── Helpers ──────────────────────────────────────────────

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  nouveau_lead:  { label: 'Nouveau',       color: '#707a8c', bg: 'bg-[rgba(112,122,140,0.1)]' },
  incomplet:     { label: 'Incomplet',     color: '#f29c12', bg: 'bg-[rgba(242,156,18,0.1)]'  },
  qualifie:      { label: 'Qualifié',      color: '#336bc7', bg: 'bg-[rgba(51,107,199,0.1)]'  },
  devis_envoye:  { label: 'Devis envoyé',  color: '#7c3aed', bg: 'bg-[rgba(124,58,237,0.1)]' },
  relance_1:     { label: 'Relance 1',     color: '#f29c12', bg: 'bg-[rgba(242,156,18,0.1)]'  },
  relance_2:     { label: 'Relance 2',     color: '#ed6a1a', bg: 'bg-[rgba(237,106,26,0.1)]'  },
  accepte:       { label: 'Accepté',       color: '#21a666', bg: 'bg-[rgba(33,166,102,0.1)]'  },
  refuse:        { label: 'Refusé',        color: '#e53935', bg: 'bg-[rgba(229,57,53,0.1)]'   },
  cas_complexe:  { label: 'Cas complexe',  color: '#e53935', bg: 'bg-[rgba(229,57,53,0.1)]'   },
  cloture:       { label: 'Clôturé',       color: '#9ca3af', bg: 'bg-[rgba(156,163,175,0.1)]' },
}

const URGENCE: Record<string, string> = {
  faible: 'bg-[#9ca3af]', normale: 'bg-[#f29c12]', urgente: 'bg-[#e53935]',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtEur(n: number) {
  if (n === 0) return '0 €'
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} k€`
  return `${n} €`
}

// ── Composants ───────────────────────────────────────────

function KpiCard({ label, value, sub, subColor = '#9ca3af', accent }: {
  label: string; value: string; sub: string; subColor?: string; accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8eaed] px-5 py-4 flex flex-col gap-1" style={accent ? { borderTop: `3px solid ${accent}` } : {}}>
      <p className="text-[11px] text-[#9ca3af] font-medium uppercase tracking-widest">{label}</p>
      <p className="text-[30px] font-extrabold text-[#12151a] leading-none mt-0.5">{value}</p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color: subColor }}>{sub}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] font-bold text-[#12151a] mb-4">{children}</p>
}

function Badge({ statut }: { statut: string }) {
  const cfg = STATUT_LABELS[statut] ?? { label: statut, color: '#707a8c', bg: 'bg-[rgba(112,122,140,0.1)]' }
  return (
    <span className={`inline-flex items-center px-2.5 h-[22px] rounded-full text-[11px] font-semibold ${cfg.bg}`} style={{ color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────

export default async function DashboardPage() {
  const d = await getDashboardData()

  return (
    <div className="space-y-5 pb-12">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] lg:text-[26px] font-extrabold text-[#12151a]">Tableau de bord</h1>
          <p className="text-[13px] text-[#9ca3af] mt-0.5">Vue commerciale · données en temps réel</p>
        </div>
        {d.totalDemandes === 0 && (
          <span className="hidden sm:block text-[11px] bg-[#fff8e1] text-[#f29c12] font-medium px-3 py-1.5 rounded-full border border-[#fde68a]">
            En attente de données
          </span>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Leads aujourd'hui"
          value={String(d.leadsAujourdhui)}
          sub={`${d.totalDemandes} au total`}
          accent="#4caf50"
          subColor="#9ca3af"
        />
        <KpiCard
          label="Taux de conversion"
          value={`${d.tauxConversion}%`}
          sub={d.devisAcceptes > 0 ? `${d.devisAcceptes} accepté${d.devisAcceptes > 1 ? 's' : ''}` : 'aucun accepté'}
          accent="#336bc7"
          subColor={d.devisAcceptes > 0 ? '#21a666' : '#9ca3af'}
        />
        <KpiCard
          label="CA potentiel HT"
          value={fmtEur(d.caPotentielHT)}
          sub={d.caAccepteHT > 0 ? `${fmtEur(d.caAccepteHT)} confirmé` : 'aucun confirmé'}
          accent="#7c3aed"
          subColor={d.caAccepteHT > 0 ? '#21a666' : '#9ca3af'}
        />
        <KpiCard
          label="Relances en attente"
          value={String(d.relancesAttente)}
          sub={d.relancesEnRetard > 0 ? `${d.relancesEnRetard} en retard` : 'à jour'}
          accent={d.relancesEnRetard > 0 ? '#e53935' : '#4caf50'}
          subColor={d.relancesEnRetard > 0 ? '#e53935' : '#21a666'}
        />
      </div>

      {/* ── Activité semaine + Pipeline ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Activité 7 jours */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Activité — 7 derniers jours</SectionTitle>
            <div className="flex items-center gap-3 text-[11px] text-[#9ca3af]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#4caf50] inline-block rounded" /> Leads</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-[#336bc7] inline-block rounded" /> Devis</span>
            </div>
          </div>
          <ActivityChart data={d.semaine} />
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <SectionTitle>Pipeline des devis</SectionTitle>
          <PipelineBar data={{
            devisEnvoyes:  d.devisEnvoyes,
            devisAcceptes: d.devisAcceptes,
            devisRefuses:  d.devisRefuses,
            devisEnCours:  d.devisEnCours,
          }} />
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#f1f3f6]">
            {[
              { label: 'Acceptés', v: d.devisAcceptes, color: '#21a666' },
              { label: 'En cours', v: d.devisEnCours,   color: '#f29c12' },
              { label: 'Refusés',  v: d.devisRefuses,   color: '#e53935' },
            ].map(({ label, v, color }) => (
              <div key={label} className="text-center">
                <p className="text-[20px] font-extrabold leading-none" style={{ color }}>{v}</p>
                <p className="text-[10px] text-[#9ca3af] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Statuts + Performances + Relances ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Donut statuts */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <SectionTitle>Répartition des dossiers</SectionTitle>
          <StatutsDonut statutCounts={d.statutCounts} />
        </div>

        {/* Jauges performances */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <SectionTitle>Performances</SectionTitle>
          <div className="flex justify-around items-center py-2">
            <GaugeRing
              pct={d.tauxConversion}
              color="#4caf50"
              size={90}
              label="Conversion"
              sublabel="leads → accepté"
            />
            <GaugeRing
              pct={d.tauxAutomatisation}
              color="#336bc7"
              size={90}
              label="Automatisation"
              sublabel="sans escalade"
            />
            <GaugeRing
              pct={d.urgentesTraitees}
              color="#f29c12"
              size={90}
              label="Urgences"
              sublabel="traitées"
            />
          </div>
          {d.dossiersEscalades > 0 && (
            <div className="mt-4 pt-3 border-t border-[#f1f3f6] flex items-center justify-between">
              <span className="text-[12px] text-[#9ca3af]">Escalades humain en cours</span>
              <span className="text-[13px] font-bold text-[#e53935]">{d.dossiersEscalades}</span>
            </div>
          )}
        </div>

        {/* Relances */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
          <SectionTitle>Relances</SectionTitle>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { v: d.relancesEnvoyees, label: 'Envoyées',  color: '#336bc7' },
              { v: d.relancesEnRetard, label: 'En retard', color: '#e53935' },
              { v: d.relancesReponses, label: 'Réponses',  color: '#21a666' },
            ].map(({ v, label, color }) => (
              <div key={label} className="bg-[#f5f7fa] rounded-xl py-3 text-center">
                <p className="text-[24px] font-extrabold leading-none" style={{ color }}>{v}</p>
                <p className="text-[10px] text-[#9ca3af] mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-[12px] mb-1.5">
              <span className="text-[#4b5563]">Taux de réponse</span>
              <span className="font-bold text-[#12151a]">{d.tauxReponseRelances}%</span>
            </div>
            <div className="h-2 bg-[#f1f3f6] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#21a666]" style={{ width: `${d.tauxReponseRelances}%` }} />
            </div>
          </div>
          {d.relancesEnRetard > 0 && (
            <p className="text-[11px] text-[#e53935] font-medium mt-3 pt-3 border-t border-[#f1f3f6]">
              ⚠ {d.relancesEnRetard} relance{d.relancesEnRetard > 1 ? 's' : ''} dépassée{d.relancesEnRetard > 1 ? 's' : ''} — à traiter
            </p>
          )}
        </div>
      </div>

      {/* ── Dernières demandes ── */}
      <div className="bg-white rounded-2xl border border-[#e8eaed] p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Dernières demandes</SectionTitle>
          {d.totalDemandes > 5 && (
            <a href="/dashboard/demandes" className="text-[12px] text-[#336bc7] hover:underline font-medium">
              Voir tout ({d.totalDemandes}) →
            </a>
          )}
        </div>
        {d.recentDemandes.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-[13px] text-[#9ca3af]">
            Aucune demande reçue pour l&apos;instant
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[#f1f3f6]">
                  {['Prospect', 'Trajet', 'Statut', 'Urgence', 'Date'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider pb-2.5 pr-4 first:pl-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.recentDemandes.map((dem, i) => (
                  <tr key={dem.id} className={`${i < d.recentDemandes.length - 1 ? 'border-b border-[#f9fafb]' : ''}`}>
                    <td className="py-3 pr-4 text-[13px] font-semibold text-[#12151a] whitespace-nowrap">{dem.nom_prospect}</td>
                    <td className="py-3 pr-4 text-[12px] text-[#4b5563] whitespace-nowrap">
                      {dem.depart && dem.destination ? `${dem.depart} → ${dem.destination}` : dem.depart ?? dem.destination ?? '—'}
                    </td>
                    <td className="py-3 pr-4"><Badge statut={dem.statut} /></td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${URGENCE[dem.urgence] ?? 'bg-[#9ca3af]'}`} />
                        <span className="text-[11px] text-[#9ca3af] capitalize">{dem.urgence ?? 'normale'}</span>
                      </span>
                    </td>
                    <td className="py-3 text-[11px] text-[#9ca3af] whitespace-nowrap">{fmtDate(dem.date_creation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
