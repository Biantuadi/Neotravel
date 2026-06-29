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

export interface DayData {
  jour: string
  leads: number
  devis: number
}

export interface DashboardData {
  leadsAujourdhui: number
  tauxConversion: number
  relancesAttente: number
  totalDemandes: number

  devisEnvoyes: number
  devisAcceptes: number
  devisRefuses: number
  devisEnCours: number

  statutCounts: Record<string, number>

  urgentesTotal: number
  urgentesTraitees: number

  tauxAutomatisation: number
  dossiersEscalades: number

  relancesEnvoyees: number
  relancesEnRetard: number
  relancesReponses: number
  tauxReponseRelances: number

  semaine: DayData[]

  caPotentielHT: number
  caAccepteHT: number

  recentDemandes: RecentDemande[]
}

const STATUTS = [
  'nouveau_lead', 'incomplet', 'qualifie', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

const DAYS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const day7ago = new Date(now)
  day7ago.setDate(day7ago.getDate() - 6)
  day7ago.setHours(0, 0, 0, 0)

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
    { data: semaineLeads },
    { data: semaineDevis },
    { data: devisCA },
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
    supabaseAdmin.from('demandes').select('statut'),
    supabaseAdmin.from('demandes')
      .select('id, nom_prospect, depart, destination, statut, urgence, date_creation')
      .order('date_creation', { ascending: false })
      .limit(5),
    supabaseAdmin.from('demandes')
      .select('date_creation')
      .gte('date_creation', day7ago.toISOString()),
    supabaseAdmin.from('demandes')
      .select('date_creation')
      .in('statut', ['devis_envoye', 'relance_1', 'relance_2', 'accepte', 'refuse'])
      .gte('date_creation', day7ago.toISOString()),
    supabaseAdmin.from('devis').select('prix_ht, statut'),
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

  const tauxConversion = total > 0 ? Math.round((acc / total) * 100) : 0
  const pctUrgTraitees = urg > 0 ? Math.round((urgT / urg) * 100) : 0
  const tauxAuto       = total > 0 ? Math.round(((total - cas) / total) * 100) : 0
  const totalRelances  = relEnv + relAtt
  const tauxRep        = totalRelances > 0 ? Math.round((relRep / totalRelances) * 100) : 0
  const devisEnCours   = Math.max(0, env - acc - ref)

  const statutCounts: Record<string, number> = Object.fromEntries(STATUTS.map(s => [s, 0]))
  for (const row of (statutRows ?? [])) {
    if (row.statut in statutCounts) statutCounts[row.statut]++
  }

  const leadsParJour: Record<string, number> = {}
  const devisParJour: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(day7ago)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    leadsParJour[key] = 0
    devisParJour[key] = 0
  }
  for (const r of (semaineLeads ?? [])) {
    const k = (r.date_creation as string).slice(0, 10)
    if (k in leadsParJour) leadsParJour[k]++
  }
  for (const r of (semaineDevis ?? [])) {
    const k = (r.date_creation as string).slice(0, 10)
    if (k in devisParJour) devisParJour[k]++
  }
  const semaine: DayData[] = Object.keys(leadsParJour).map(key => ({
    jour: DAYS_FR[new Date(key + 'T12:00:00').getDay()],
    leads: leadsParJour[key],
    devis: devisParJour[key],
  }))

  let caPotentielHT = 0
  let caAccepteHT = 0
  for (const d of (devisCA ?? [])) {
    if (d.statut !== 'refuse') caPotentielHT += d.prix_ht ?? 0
    if (d.statut === 'accepte') caAccepteHT += d.prix_ht ?? 0
  }

  return {
    leadsAujourdhui:    leadsAujourdhui ?? 0,
    tauxConversion,
    relancesAttente:    relAtt,
    totalDemandes:      total,
    devisEnvoyes:       env,
    devisAcceptes:      acc,
    devisRefuses:       ref,
    devisEnCours,
    statutCounts,
    urgentesTotal:      urg,
    urgentesTraitees:   pctUrgTraitees,
    tauxAutomatisation: tauxAuto,
    dossiersEscalades:  cas,
    relancesEnvoyees:   relEnv,
    relancesEnRetard:   relRet,
    relancesReponses:   relRep,
    tauxReponseRelances: tauxRep,
    semaine,
    caPotentielHT:      Math.round(caPotentielHT),
    caAccepteHT:        Math.round(caAccepteHT),
    recentDemandes:     (recentRows ?? []) as RecentDemande[],
  }
}
