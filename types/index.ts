export type StatutDemande =
  | 'nouveau_lead'
  | 'incomplet'
  | 'qualifie'
  | 'devis_envoye'
  | 'relance_1'
  | 'relance_2'
  | 'accepte'
  | 'refuse'
  | 'cas_complexe'
  | 'cloture'

export type UrgenceLevel = 'faible' | 'normale' | 'urgente'
export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
export type StatutRelance = 'programmee' | 'envoyee' | 'echec'
export type TypeClient = 'particulier' | 'entreprise' | 'collectivite'

export interface Demande {
  id: string
  client_id: string | null
  nom_prospect: string
  email: string | null
  telephone: string | null
  nb_passagers: number | null
  depart: string | null
  destination: string | null
  date_depart: string | null
  date_retour: string | null
  statut: StatutDemande
  urgence: UrgenceLevel
  score_completude: number
  budget_estime: number | null
  commentaire_client: string | null
  date_creation: string
  updated_at: string
}

export interface ParamsDevis {
  nb_passagers: number
  date_depart: string       // ISO date
  date_demande: string      // ISO date
  distance_km: number
  options: OptionDevis[]
}

export type OptionDevis = 'guide' | 'nuit_chauffeur' | 'peages'

export interface LigneDevis {
  libelle: string
  montant: number
}

export interface ResultatDevis {
  prix_ht: number
  tva: number
  prix_ttc: number
  lignes: LigneDevis[]
  coefficients: Record<string, number>
  devise: 'EUR'
}
