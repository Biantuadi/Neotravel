import { tool } from 'ai'
import { z } from 'zod'
import { calculerDevis } from '@/lib/calculer-devis'
import type { ParamsDevis } from '@/lib/calculer-devis'
import { supabaseAdmin } from '@/lib/supabase'
import { envoyerEmailDevis } from '@/lib/email-devis'

async function geocodeVille(ville: string, apiKey: string): Promise<{ coords: [number, number]; country: string } | null> {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(ville)}&size=1&layers=locality,county,region`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (!data.features?.length) return null
  const f = data.features[0]
  return {
    coords:  f.geometry.coordinates as [number, number],
    country: (f.properties.country_a ?? f.properties.country_code ?? 'unknown').toLowerCase(),
  }
}

// demandeRef est une référence mutable : sa valeur est mise à jour dans onStepFinish
// après que enregistrer_lead retourne le demande_id, sans recréer les closures.
export const tools = (demandeRef: { current: string | undefined }) => ({
  calculer_distance: tool({
    description: 'Calcule la distance routière en km entre deux villes. Appeler AUTOMATIQUEMENT dès que la ville de départ et la ville de destination sont connues, sans demander la distance au prospect.',
    inputSchema: z.object({
      depart:      z.string().describe('Ville de départ (ex: "Paris", "Lyon")'),
      destination: z.string().describe('Ville de destination'),
    }),
    execute: async ({ depart, destination }) => {
      const apiKey = process.env.ORS_API_KEY
      if (!apiKey) {
        return { success: false, error: 'ORS_API_KEY manquante — demande la distance au prospect.' }
      }

      try {
        const [geoDepart, geoDest] = await Promise.all([
          geocodeVille(depart, apiKey),
          geocodeVille(destination, apiKey),
        ])

        if (!geoDepart) return { success: false, error: `Ville de départ introuvable : ${depart}` }
        if (!geoDest)   return { success: false, error: `Ville de destination introuvable : ${destination}` }

        const isFrance = (c: string) => c === 'fr' || c === 'fra'
        const international = !isFrance(geoDepart.country) || !isFrance(geoDest.country)

        const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
          method: 'POST',
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ coordinates: [geoDepart.coords, geoDest.coords] }),
        })

        if (!res.ok) {
          // ORS retourne 400/500 quand aucune route terrestre n'existe (île, DOM-TOM, etc.)
          const errData = await res.json().catch(() => null)
          const orsCode = errData?.error?.code
          // codes 2009/2010/2099 = pas d'itinéraire routier possible
          const routeImpossible = [2009, 2010, 2099].includes(orsCode) || res.status === 404
          if (routeImpossible) {
            return { success: false, routeImpossible: true }
          }
          throw new Error(`ORS ${res.status}`)
        }

        const data = await res.json()
        const distanceKm = Math.round(data.routes[0].summary.distance / 1000)
        const dureeMin   = Math.round(data.routes[0].summary.duration  / 60)

        return { success: true, distanceKm, dureeMin, international }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    },
  }),

  calculer_devis: tool({
    description: 'Calcule le prix d\'un devis de transport de groupe de manière déterministe. Appeler uniquement quand toutes les infos sont collectées.',
    inputSchema: z.object({
      nbPassagers:   z.number().int().min(1).max(59).describe('Nombre de passagers'),
      distanceKm:   z.number().positive().describe('Distance en kilomètres'),
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
      const resultat = await calculerDevis(params as ParamsDevis)
      const did = demandeRef.current

      if (did) {
        await Promise.all([
          supabaseAdmin.from('devis').insert({
            demande_id: did,
            prix_ht:  resultat.prixHT,
            tva:      resultat.tva,
            prix_ttc: resultat.prixTTC,
            devise:   resultat.devise,
            lignes:   resultat.lignes,
            statut:   'brouillon',
          }),
          supabaseAdmin.from('logs').insert({
            demande_id: did,
            action: 'calculer_devis',
            outil_utilise: 'calculer_devis()',
          }),
          supabaseAdmin.from('demandes').update({
            statut: 'qualifie',
            updated_at: new Date().toISOString(),
          }).eq('id', did),
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
      // Garde-fou : refuser l'enregistrement sans trajet minimum
      if (!params.depart || !params.destination) {
        return { success: false, error: 'Enregistrement refusé : départ et destination requis avant de créer un lead.' }
      }

      const champs = ['nom_prospect', 'email', 'telephone', 'nb_passagers', 'depart', 'destination', 'date_depart']
      const score = Math.round(champs.filter(c => params[c as keyof typeof params] != null).length / champs.length * 100)
      const now = new Date().toISOString()

      // 1. Upsert client
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
          nom_prospect:       params.nom_prospect,
          email:              params.email ?? null,
          telephone:          params.telephone ?? null,
          nb_passagers:       params.nb_passagers ?? null,
          depart:             params.depart ?? null,
          destination:        params.destination ?? null,
          date_depart:        params.date_depart ?? null,
          date_retour:        params.date_retour ?? null,
          commentaire_client: params.commentaire_client ?? null,
          client_id,
          statut: 'nouveau_lead',
          score_completude: score,
        })
        .select('id')
        .single()

      if (error) return { success: false, error: error.message }

      // Mettre à jour la ref pour que les tools suivants (calculer_devis, etc.) aient le bon id
      demandeRef.current = data.id

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
      nbPassagers:  z.number().int().min(1).max(59),
      distanceKm:   z.number().positive(),
      dateDemande:  z.string().describe('Date de la demande YYYY-MM-DD'),
      dateDepart:   z.string().describe('Date de départ YYYY-MM-DD'),
      options: z.object({
        guideJours:     z.number().int().min(0).optional(),
        nuitsChauffeur: z.number().int().min(0).optional(),
        peages:         z.number().min(0).optional(),
      }).optional(),
    }),
    execute: async (params) => {
      const did = demandeRef.current

      // Idempotence : ne pas envoyer 2 fois pour la même demande
      if (did) {
        const { data: alreadySent } = await supabaseAdmin
          .from('devis')
          .select('id')
          .eq('demande_id', did)
          .eq('statut', 'envoye')
          .maybeSingle()
        if (alreadySent) {
          return { success: true, reference: 'déjà envoyé', message: 'Le devis a déjà été envoyé par email.' }
        }
      }

      const devis = await calculerDevis({
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

      if (did) {
        const sentAt = new Date().toISOString()

        // Vérifie si un devis brouillon existe déjà pour cette demande
        const { data: existing } = await supabaseAdmin
          .from('devis')
          .select('id')
          .eq('demande_id', did)
          .eq('statut', 'brouillon')
          .maybeSingle()

        await Promise.all([
          supabaseAdmin.from('logs').insert({
            demande_id: did,
            action: 'devis_envoye_email',
            outil_utilise: 'envoyer_devis_par_email()',
          }),
          supabaseAdmin.from('demandes').update({
            statut: 'devis_envoye',
            updated_at: sentAt,
          }).eq('id', did),
          existing
            // Met à jour le brouillon existant
            ? supabaseAdmin.from('devis').update({
                statut: 'envoye',
                envoye_le: sentAt,
                updated_at: sentAt,
              }).eq('id', existing.id)
            // Crée le devis directement en statut "envoye" s'il n'existait pas
            : supabaseAdmin.from('devis').insert({
                demande_id: did,
                prix_ht:   devis.prixHT,
                tva:       devis.tva,
                prix_ttc:  devis.prixTTC,
                devise:    devis.devise,
                lignes:    devis.lignes,
                statut:    'envoye',
                envoye_le: sentAt,
              }),
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
    execute: async ({ raison }) => {
      const did = demandeRef.current
      if (did) {
        await supabaseAdmin
          .from('demandes')
          .update({ statut: 'cas_complexe', updated_at: new Date().toISOString() })
          .eq('id', did)
        await supabaseAdmin.from('logs').insert({
          demande_id: did,
          action: 'escalade_humain',
          outil_utilise: 'escalader_humain()',
          erreur: raison,
        })
      }
      return { success: true, message: 'Dossier transmis à l\'équipe commerciale. Un conseiller vous contactera sous 24h.' }
    },
  }),
})
