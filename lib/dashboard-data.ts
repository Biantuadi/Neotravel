import { supabaseAdmin } from '@/lib/supabase'

export interface DashboardData {
  // KPIs
  leadsAujourdhui: number
  tauxConversion: number        // %
  relancesAttente: number

  // Pipeline devis
  devisEnvoyes: number
  devisAcceptes: number
  devisRefuses: number

  // Demandes urgentes
  urgentesTraitees: number      // %
  urgentesEnAttente: number     // %
  urgentesParJour: number       // moyenne

  // Automatisation
  tauxAutomatisation: number    // %
  tauxHumain: number            // %
  tauxHitlHauteValeur: number   // %
  dossiersEnAttenteCommercial: number

  // Relances indicateurs
  relancesEnvoyees: number
  relancesEnRetard: number
  relancesReponses: number
  tauxReponseRelances: number   // %

  // Temps gagné (valeurs fixes issues du Figma)
  tempsSemaine: { label: string; heures: number; max: number }[]
}

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
    { count: haute_valeur },
  ] = await Promise.all([
    // Leads aujourd'hui
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .gte('date_creation', startOfDay.toISOString()),

    // Total demandes
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true }),

    // Acceptées
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'accepte'),

    // Devis envoyés (tous statuts après envoi)
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .in('statut', ['devis_envoye', 'relance_1', 'relance_2', 'accepte', 'refuse']),

    // Devis refusés
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'refuse'),

    // Demandes urgentes total
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('urgence', 'urgente'),

    // Urgentes traitées (accepte ou refuse ou cloture)
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('urgence', 'urgente')
      .in('statut', ['accepte', 'refuse', 'cloture', 'devis_envoye']),

    // Cas complexes (escalade humain)
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .eq('statut', 'cas_complexe'),

    // Relances en attente (programmée)
    supabaseAdmin.from('relances').select('*', { count: 'exact', head: true })
      .eq('statut', 'programmee'),

    // Relances envoyées
    supabaseAdmin.from('relances').select('*', { count: 'exact', head: true })
      .eq('statut', 'envoyee'),

    // Relances en retard (programmée mais date passée)
    supabaseAdmin.from('relances').select('*', { count: 'exact', head: true })
      .eq('statut', 'programmee')
      .lt('date_programmee', now.toISOString()),

    // Relances avec réponse (demande acceptée ou refusée après relance)
    supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true })
      .in('statut', ['relance_1', 'relance_2', 'accepte', 'refuse'])
      .not('statut', 'eq', 'devis_envoye'),

    // Haute valeur : devis > 5000 € validés par humain
    supabaseAdmin.from('devis').select('*', { count: 'exact', head: true })
      .eq('valide_par_humain', true)
      .gte('prix_ttc', 5000),
  ])

  const total = totalDemandes ?? 0
  const acc = acceptees ?? 0
  const env = devisEnvoyes ?? 0
  const ref = devisRefuses ?? 0
  const urg = urgentesTotal ?? 0
  const urgTrait = urgentesTraiteesCount ?? 0
  const cas = casComplexes ?? 0
  const relAtt = relancesAttenteCount ?? 0
  const relEnv = relancesEnvoyees ?? 0
  const relRet = relancesEnRetard ?? 0
  const relRep = relancesReponses ?? 0
  const hv = haute_valeur ?? 0

  const tauxConversion = total > 0 ? Math.round((acc / total) * 100) : 0
  const pctUrgTraitees = urg > 0 ? Math.round((urgTrait / urg) * 100) : 0
  const pctUrgAttente = 100 - pctUrgTraitees

  // Taux automatisation : cas non escaladés / total
  const tauxAuto = total > 0 ? Math.round(((total - cas) / total) * 100) : 0
  const tauxHumain = 100 - tauxAuto

  // HITL haute valeur en % du total
  const tauxHitl = total > 0 ? Math.round((hv / total) * 100) : 0

  // Taux de réponse aux relances
  const totalRelances = relEnv + relAtt
  const tauxRep = totalRelances > 0 ? Math.round((relRep / totalRelances) * 100) : 0

  // Urgences par jour : total urgentes / 7 (semaine glissante approximative)
  const urgParJour = Math.max(1, Math.round(urg / 7))

  return {
    leadsAujourdhui: leadsAujourdhui ?? 0,
    tauxConversion,
    relancesAttente: relAtt,
    devisEnvoyes: env,
    devisAcceptes: acc,
    devisRefuses: ref,
    urgentesTraitees: pctUrgTraitees,
    urgentesEnAttente: pctUrgAttente,
    urgentesParJour: urgParJour,
    tauxAutomatisation: tauxAuto,
    tauxHumain,
    tauxHitlHauteValeur: tauxHitl,
    dossiersEnAttenteCommercial: cas,
    relancesEnvoyees: relEnv,
    relancesEnRetard: relRet,
    relancesReponses: relRep,
    tauxReponseRelances: tauxRep,
    tempsSemaine: [
      { label: 'Qualification leads', heures: 12, max: 12 },
      { label: 'Rédaction devis',     heures: 8,  max: 12 },
      { label: 'Relances manuelles',  heures: 6,  max: 12 },
      { label: 'Suivi pipeline',      heures: 4,  max: 12 },
    ],
  }
}
