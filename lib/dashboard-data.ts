import { supabaseAdmin } from '@/lib/supabase'

export interface RecentDemande {
  id: string
  nom_prospect: string
  depart: string | null
  destination: string | null
  statut: string
  urgence: string
  date_creation: string
}

export interface DashboardData {
  leadsAujourdhui: number
  tauxConversion: number
  relancesAttente: number
  totalDemandes: number

  // Pipeline devis
  devisEnvoyes: number
  devisAcceptes: number
  devisRefuses: number

  // Répartition statuts
  statutCounts: Record<string, number>

  // Urgences
  urgentesTotal: number
  urgentesTraitees: number  // %

  // Automatisation
  tauxAutomatisation: number
  dossiersEscalades: number

  // Relances
  relancesEnvoyees: number
  relancesEnRetard: number
  relancesReponses: number
  tauxReponseRelances: number

  // 5 dernières demandes
  recentDemandes: RecentDemande[]
}

const STATUTS = [
  'nouveau_lead', 'incomplet', 'qualifie', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const [
    { count: leadsAujourdhui },
    { count: totalDemandes },
    { count: acceptees },
    { count: devisEnvoyes },
    { count: devisRefuses },
    { count: urgentesTotal },
    { count: urgentesTraiteesCount },
    { count: casComplexes },
    { count: relancesAttenteCount },
    { count: relancesEnvoyees },
    { count: relancesEnRetard },
    { count: relancesReponses },
    { data: statutRows },
    { data: recentRows },
  ] = await Promise.all([
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .gte('date_creation', startOfDay.toISOString()),

    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true }),

    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'accepte'),

    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .in('statut', ['devis_envoye', 'relance_1', 'relance_2', 'accepte', 'refuse']),

    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'refuse'),

    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('urgence', 'urgente'),

    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('urgence', 'urgente')
      .in('statut', ['accepte', 'refuse', 'cloture', 'devis_envoye']),

    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'cas_complexe'),

    supabaseAdmin.from('relances').select('*', { count: 'exact', head: true })
      .eq('statut', 'programmee'),

    supabaseAdmin.from('relances').select('*', { count: 'exact', head: true })
      .eq('statut', 'envoyee'),

    supabaseAdmin.from('relances').select('*', { count: 'exact', head: true })
      .eq('statut', 'programmee')
      .lt('date_programmee', now.toISOString()),

    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .in('statut', ['relance_1', 'relance_2', 'accepte', 'refuse']),

    // Répartition par statut
    supabaseAdmin.from('demandes').select('statut'),

    // 5 demandes les plus récentes
    supabaseAdmin.from('demandes')
      .select('id, nom_prospect, depart, destination, statut, urgence, date_creation')
      .order('date_creation', { ascending: false })
      .limit(5),
  ])

  const total = totalDemandes ?? 0
  const acc   = acceptees ?? 0
  const env   = devisEnvoyes ?? 0
  const ref   = devisRefuses ?? 0
  const urg   = urgentesTotal ?? 0
  const urgT  = urgentesTraiteesCount ?? 0
  const cas   = casComplexes ?? 0
  const relAtt = relancesAttenteCount ?? 0
  const relEnv = relancesEnvoyees ?? 0
  const relRet = relancesEnRetard ?? 0
  const relRep = relancesReponses ?? 0

  const tauxConversion  = total > 0 ? Math.round((acc / total) * 100) : 0
  const pctUrgTraitees  = urg > 0 ? Math.round((urgT / urg) * 100) : 0
  const tauxAuto        = total > 0 ? Math.round(((total - cas) / total) * 100) : 0
  const totalRelances   = relEnv + relAtt
  const tauxRep         = totalRelances > 0 ? Math.round((relRep / totalRelances) * 100) : 0

  // Compter les statuts
  const statutCounts: Record<string, number> = Object.fromEntries(STATUTS.map(s => [s, 0]))
  for (const row of (statutRows ?? [])) {
    if (row.statut in statutCounts) statutCounts[row.statut]++
  }

  return {
    leadsAujourdhui:    leadsAujourdhui ?? 0,
    tauxConversion,
    relancesAttente:    relAtt,
    totalDemandes:      total,
    devisEnvoyes:       env,
    devisAcceptes:      acc,
    devisRefuses:       ref,
    statutCounts,
    urgentesTotal:      urg,
    urgentesTraitees:   pctUrgTraitees,
    tauxAutomatisation: tauxAuto,
    dossiersEscalades:  cas,
    relancesEnvoyees:   relEnv,
    relancesEnRetard:   relRet,
    relancesReponses:   relRep,
    tauxReponseRelances: tauxRep,
    recentDemandes:     (recentRows ?? []) as RecentDemande[],
  }
}
