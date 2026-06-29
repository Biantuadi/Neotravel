import { tool } from 'ai'
import { z } from 'zod'
import { calculerDevis } from '@/lib/calculer-devis'
import type { ParamsDevis } from '@/lib/calculer-devis'
import { supabaseAdmin } from '@/lib/supabase'
import { envoyerEmailDevis } from '@/lib/email-devis'

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
        await Promise.all([
          supabaseAdmin.from('devis').insert({
            demande_id,
            prix_ht:  resultat.prixHT,
            tva:      resultat.tva,
            prix_ttc: resultat.prixTTC,
            devise:   resultat.devise,
            lignes:   resultat.lignes,
            statut:   'brouillon',
          }),
          supabaseAdmin.from('logs').insert({
            demande_id,
            action: 'calculer_devis',
            outil_utilise: 'calculer_devis()',
          }),
          supabaseAdmin.from('demandes').update({
            statut: 'qualifie',
            updated_at: new Date().toISOString(),
          }).eq('id', demande_id),
        ])
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
      const now = new Date().toISOString()

      // 1. Upsert client (match sur email si présent, sinon toujours créer)
      let client_id: string | null = null
      if (params.email) {
        const { data: existing } = await supabaseAdmin
          .from('clients')
          .select('id, nb_demandes')
          .eq('email', params.email)
          .maybeSingle()

        if (existing) {
          await supabaseAdmin.from('clients').update({
            nom: params.nom_prospect,
            telephone: params.telephone ?? undefined,
            nb_demandes: existing.nb_demandes + 1,
            derniere_demande: now,
            updated_at: now,
          }).eq('id', existing.id)
          client_id = existing.id
        } else {
          const { data: created } = await supabaseAdmin
            .from('clients')
            .insert({
              nom: params.nom_prospect,
              email: params.email,
              telephone: params.telephone ?? null,
              nb_demandes: 1,
              derniere_demande: now,
            })
            .select('id')
            .single()
          client_id = created?.id ?? null
        }
      } else {
        // Pas d'email — créer un client anonyme quand même pour traçabilité
        const { data: created } = await supabaseAdmin
          .from('clients')
          .insert({
            nom: params.nom_prospect,
            telephone: params.telephone ?? null,
            nb_demandes: 1,
            derniere_demande: now,
          })
          .select('id')
          .single()
        client_id = created?.id ?? null
      }

      // 2. Créer la demande liée au client
      const { data, error } = await supabaseAdmin
        .from('demandes')
        .insert({
          ...params,
          client_id,
          statut: 'nouveau_lead',
          score_completude: score,
        })
        .select('id')
        .single()

      if (error) return { success: false, error: error.message }
      return { success: true, demande_id: data.id, client_id }
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

  envoyer_devis_par_email: tool({
    description: 'Génère le PDF du devis et l\'envoie par email au prospect. Appeler après avoir affiché le montant et obtenu l\'email du prospect.',
    inputSchema: z.object({
      nom_prospect: z.string().describe('Nom du prospect'),
      email:        z.string().email().describe('Email du prospect'),
      depart:       z.string().optional().describe('Ville de départ'),
      destination:  z.string().optional().describe('Ville de destination'),
      // Paramètres du devis — pour recalculer et générer le PDF
      nbPassagers:  z.number().int().min(1).max(85),
      distanceKm:   z.number().positive().max(1500),
      dateDemande:  z.string().describe('Date de la demande YYYY-MM-DD'),
      dateDepart:   z.string().describe('Date de départ YYYY-MM-DD'),
      options: z.object({
        guideJours:     z.number().int().min(0).optional(),
        nuitsChauffeur: z.number().int().min(0).optional(),
        peages:         z.number().min(0).optional(),
      }).optional(),
    }),
    execute: async (params) => {
      const devis = calculerDevis({
        nbPassagers: params.nbPassagers,
        distanceKm:  params.distanceKm,
        dateDemande: params.dateDemande,
        dateDepart:  params.dateDepart,
        options:     params.options,
      })

      const reference = `NEO-${Date.now()}`

      await envoyerEmailDevis({
        prospect: {
          nom:         params.nom_prospect,
          email:       params.email,
          depart:      params.depart,
          destination: params.destination,
          dateDepart:  params.dateDepart,
        },
        devis,
        reference,
      })

      if (demande_id) {
        const sentAt = new Date().toISOString()
        await Promise.all([
          supabaseAdmin.from('logs').insert({
            demande_id,
            action: 'devis_envoye_email',
            outil_utilise: 'envoyer_devis_par_email()',
          }),
          supabaseAdmin.from('demandes').update({
            statut: 'devis_envoye',
            updated_at: sentAt,
          }).eq('id', demande_id),
          // Passer le devis de "brouillon" à "envoye"
          supabaseAdmin.from('devis').update({
            statut: 'envoye',
            envoye_le: sentAt,
            updated_at: sentAt,
          }).eq('demande_id', demande_id).eq('statut', 'brouillon'),
        ])
      }

      return {
        success: true,
        reference,
        message: `Devis ${reference} envoyé par email à ${params.email}.`,
      }
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
