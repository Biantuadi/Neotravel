import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import ClientsView, { type ClientRow } from './ClientsView'

export const metadata: Metadata = { title: 'NeoTravel — Clients' }
export const revalidate = 30

// ── KPI ──────────────────────────────────────────────────

function KpiCard({ label, value, note, noteColor }: {
  label: string; value: string; note: string; noteColor: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-5 py-4 flex flex-col gap-1">
      <p className="text-[11px] text-[#707a8c]">{label}</p>
      <p className="text-[32px] font-extrabold text-[#12151a] leading-none py-1">{value}</p>
      <p className={`text-[11px] font-medium ${noteColor}`}>{note}</p>
    </div>
  )
}

// ── Données ───────────────────────────────────────────────

async function getClientsData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Fetch clients + leurs demandes/devis/relances en parallèle
  const [
    { data: clients },
    { count: nouveauxCeMois },
  ] = await Promise.all([
    supabaseAdmin.from('clients')
      .select(`
        id, nom, email, telephone, nb_demandes, derniere_demande, created_at,
        demandes (
          id, depart, destination, date_depart, statut,
          devis ( id, prix_ttc, statut ),
          relances ( id, type, date_programmee, statut )
        )
      `)
      .order('derniere_demande', { ascending: false, nullsFirst: false })
      .limit(300),

    // Nouveaux ce mois
    supabaseAdmin.from('clients').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString()),
  ])

  // Les devis et relances sont imbriqués dans chaque demande
  const clientRows: ClientRow[] = (clients ?? []).map(c => {
    type RawDemande = {
      id: string; depart: string | null; destination: string | null;
      date_depart: string | null; statut: string;
      devis?: { id: string; prix_ttc: number; statut: string }[]
      relances?: { id: string; type: string; date_programmee: string; statut: string }[]
    }
    const rawDemandes = (c.demandes ?? []) as RawDemande[]

    return {
      id: c.id,
      nom: c.nom,
      email: c.email,
      telephone: c.telephone,
      nb_demandes: c.nb_demandes,
      derniere_demande: c.derniere_demande,
      created_at: c.created_at,
      demandes: rawDemandes.map(({ id, depart, destination, date_depart, statut }) => ({
        id, depart, destination, date_depart, statut,
      })),
      devis:    rawDemandes.flatMap(d => d.devis ?? []),
      relances: rawDemandes.flatMap(d => d.relances ?? []),
    }
  })

  // KPIs calculés côté serveur
  const total = clientRows.length
  const actifs = clientRows.filter(c => c.demandes.some(d =>
    ['devis_envoye', 'relance_1', 'relance_2', 'qualifie', 'accepte'].includes(d.statut)
  )).length
  const convertis = clientRows.filter(c =>
    c.demandes.some(d => d.statut === 'accepte')
  ).length
  const perdus = clientRows.filter(c =>
    c.demandes.length > 0 && c.demandes.every(d => d.statut === 'refuse')
  ).length
  const enAttente = clientRows.filter(c =>
    c.demandes.some(d => ['devis_envoye', 'relance_1', 'relance_2'].includes(d.statut)) &&
    !c.demandes.some(d => d.statut === 'accepte')
  ).length

  return {
    total, actifs, convertis, perdus, enAttente,
    nouveauxCeMois: nouveauxCeMois ?? 0,
    clients: clientRows,
  }
}

// ── Page ─────────────────────────────────────────────────

export default async function ClientsPage() {
  const d = await getClientsData()

  return (
    <>
      <h1 className="text-2xl lg:text-[26px] font-extrabold text-[#12151a]">Clients</h1>
      <p className="text-[13px] text-[#707a8c] mt-1 mb-6">CRM — Vue globale de votre portefeuille client</p>

      {/* KPIs : 2 cols mobile → 5 xl */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Total clients"
          value={d.total.toLocaleString('fr-FR')}
          note="dans la base"
          noteColor="text-[#707a8c]"
        />
        <KpiCard
          label="Clients actifs"
          value={String(d.actifs)}
          note={d.nouveauxCeMois > 0 ? `↑ +${d.nouveauxCeMois} ce mois` : 'ce mois'}
          noteColor="text-[#4caf50]"
        />
        <KpiCard
          label="En attente"
          value={String(d.enAttente)}
          note={d.enAttente > 0 ? 'devis non signé' : 'aucun'}
          noteColor={d.enAttente > 0 ? 'text-[#f29c12]' : 'text-[#21a666]'}
        />
        <KpiCard
          label="Convertis"
          value={String(d.convertis)}
          note="devis signé"
          noteColor="text-[#4caf50]"
        />
        <KpiCard
          label="Perdus"
          value={String(d.perdus)}
          note={d.perdus > 0 ? '↓ refusés' : 'aucun'}
          noteColor={d.perdus > 0 ? 'text-[#e53935]' : 'text-[#21a666]'}
        />
      </div>

      {/* Table + panneau détail */}
      <ClientsView clients={d.clients} />
    </>
  )
}
