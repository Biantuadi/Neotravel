import { tool } from 'ai'
import { z } from 'zod'
import { calculerDevis } from '@/lib/calculer-devis'
import type { ParamsDevis } from '@/lib/calculer-devis'
import { supabaseAdmin } from '@/lib/supabase'

export const tools = (demande_id?: string) => ({
  calculer_devis: tool({
    description: 'Calcule le prix d\'un devis de transport de groupe de manière déterministe. Appeler uniquement quand toutes les infos sont collectées.',
    inputSchema: z.object({
      nbPassagers:   z.number().int().min(1).max(85).describe('Nombre de passagers'),
      distanceKm:   z.number().positive().max(1500).describe('Distance en kilomètres'),
      dateDemande:  z.string().describe('Date de la demande au format YYYY-MM-DD'),
      dateDepart:   z.string().describe('Date de départ au format YYYY-MM-DD'),
      typeVehicule: z.string().optional(),
      options: z.object({
        guideJours:     z.number().int().min(0).optional(),
        nuitsChauffeur: z.number().int().min(0).optional(),
        peages:         z.number().min(0).optional(),
      }).optional(),
    }),
    execute: async (params) => {
      const resultat = calculerDevis(params as ParamsDevis)
      if (demande_id) {
        await supabaseAdmin.from('logs').insert({
          demande_id,
          action: 'calculer_devis',
          outil_utilise: 'calculer_devis()',
        })
      }
      return resultat
    },
  }),

  enregistrer_lead: tool({
    description: 'Enregistre la demande du prospect en base de données.',
    inputSchema: z.object({
      nom_prospect:       z.string(),
      email:              z.string().email().optional(),
      telephone:          z.string().optional(),
      nb_passagers:       z.number().int().positive().optional(),
      depart:             z.string().optional(),
      destination:        z.string().optional(),
      date_depart:        z.string().optional(),
      date_retour:        z.string().optional(),
      commentaire_client: z.string().optional(),
    }),
    execute: async (params) => {
      const champs = ['nom_prospect', 'email', 'telephone', 'nb_passagers', 'depart', 'destination', 'date_depart']
      const score = Math.round(champs.filter(c => params[c as keyof typeof params] != null).length / champs.length * 100)

      const { data, error } = await supabaseAdmin
        .from('demandes')
        .insert({ ...params, statut: 'nouveau_lead', score_completude: score })
        .select('id')
        .single()

      if (error) return { success: false, error: error.message }
      return { success: true, demande_id: data.id }
    },
  }),

  mettre_a_jour_statut: tool({
    description: 'Met à jour le statut d\'une demande dans le CRM.',
    inputSchema: z.object({
      demande_id: z.string().uuid(),
      statut: z.enum([
        'nouveau_lead', 'incomplet', 'qualifie', 'devis_envoye',
        'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
      ]),
    }),
    execute: async ({ demande_id, statut }) => {
      const { error } = await supabaseAdmin
        .from('demandes')
        .update({ statut, updated_at: new Date().toISOString() })
        .eq('id', demande_id)
      return { success: !error, error: error?.message }
    },
  }),

  escalader_humain: tool({
    description: 'Transfère le dossier à un commercial humain pour les cas complexes.',
    inputSchema: z.object({
      demande_id: z.string().uuid().optional(),
      raison:     z.string(),
      contexte:   z.string(),
    }),
    execute: async ({ demande_id, raison }) => {
      if (demande_id) {
        await supabaseAdmin
          .from('demandes')
          .update({ statut: 'cas_complexe', updated_at: new Date().toISOString() })
          .eq('id', demande_id)
        await supabaseAdmin.from('logs').insert({
          demande_id,
          action: 'escalade_humain',
          outil_utilise: 'escalader_humain()',
          erreur: raison,
        })
      }
      return { success: true, message: 'Dossier transmis à l\'équipe commerciale. Un conseiller vous contactera sous 24h.' }
    },
  }),
})
