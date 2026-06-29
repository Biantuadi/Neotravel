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

// Types de pricing — source de vérité dans lib/calculer-devis.ts
import type { LigneDevis } from '@/lib/calculer-devis'
export type { ParamsDevis, LigneDevis, Devis } from '@/lib/calculer-devis'

// ─── Tables Supabase ─────────────────────────────────────────────────────────

export interface DevisDB {
  id: string
  created_at: string
  demande_id: string
  prix_ht: number
  tva: number
  prix_ttc: number
  devise: 'EUR'
  lignes: LigneDevis[]
  pdf_url?: string
  envoye_le?: string
}

export interface Relance {
  id: string
  created_at: string
  demande_id: string
  type: 'relance_1' | 'relance_2'
  envoyee_le?: string
  statut: StatutRelance
}

export interface Log {
  id: string
  created_at: string
  demande_id?: string
  action: string
  outil_utilise?: string
  erreur?: string
}

export interface Client {
  id: string
  created_at: string
  nom: string
  email?: string
  telephone?: string
  type_client?: TypeClient
  nb_demandes: number
  derniere_demande?: string
}

// ─── Réponses API ─────────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }
