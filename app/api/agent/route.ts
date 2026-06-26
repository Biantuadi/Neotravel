import { anthropic } from '@ai-sdk/anthropic'
import { streamText, tool, isStepCount } from 'ai'
import { z } from 'zod'
import { calculerDevis } from '@/lib/calculer-devis'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

const SYSTEM_PROMPT = `Tu es l'assistant commercial de NeoTravel, une entreprise de transport de groupes en autocar.

Ton rôle est de qualifier les demandes de transport et de générer des devis précis.

RÈGLES ABSOLUES :
- Tu ne calcules JAMAIS un prix toi-même. Tu appelles TOUJOURS le tool calculer_devis() pour ça.
- Si des informations manquent (départ, destination, date, nombre de passagers), tu les demandes poliment avant de calculer.
- Pour les cas complexes (> 80 passagers, budget très élevé, demande ambiguë), tu escalades vers un humain.
- Tu es professionnel, concis et bienveillant.

INFORMATIONS REQUISES pour un devis :
1. Lieu de départ
2. Lieu de destination
3. Date de départ
4. Nombre de passagers
5. Distance approximative en km (tu peux l'estimer si nécessaire)

CHAMPS OPTIONNELS :
- Date de retour
- Guide / accompagnateur
- Nuit chauffeur
- Péages`

const calculerDevisParams = z.object({
  nb_passagers: z.number().int().positive().describe('Nombre de passagers'),
  date_depart: z.string().describe('Date de départ au format YYYY-MM-DD'),
  date_demande: z.string().describe('Date d\'aujourd\'hui au format YYYY-MM-DD'),
  distance_km: z.number().positive().describe('Distance en kilomètres'),
  options: z.array(z.enum(['guide', 'nuit_chauffeur', 'peages'])).describe('Options supplémentaires'),
})

const enregistrerLeadParams = z.object({
  nom_prospect: z.string().describe('Nom complet du prospect'),
  email: z.string().email().optional().describe('Email du prospect'),
  telephone: z.string().optional().describe('Téléphone du prospect'),
  nb_passagers: z.number().int().positive().optional(),
  depart: z.string().optional(),
  destination: z.string().optional(),
  date_depart: z.string().optional(),
  date_retour: z.string().optional(),
  commentaire_client: z.string().optional(),
})

const mettreAJourStatutParams = z.object({
  demande_id: z.string().uuid().describe('ID de la demande'),
  statut: z.enum([
    'nouveau_lead', 'incomplet', 'qualifie', 'devis_envoye',
    'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture'
  ]),
})

const escaladerHumainParams = z.object({
  demande_id: z.string().uuid().optional(),
  raison: z.string().describe('Pourquoi ce cas nécessite une intervention humaine'),
  contexte: z.string().describe('Résumé du dossier pour le commercial'),
})

export async function POST(req: Request) {
  const { messages, demande_id } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages,
    stopWhen: isStepCount(10),
    tools: {
      calculer_devis: tool({
        description: 'Calcule le prix d\'un devis de transport de groupe de manière déterministe. Appeler uniquement quand toutes les infos sont collectées.',
        inputSchema: calculerDevisParams,
        execute: async (params: z.infer<typeof calculerDevisParams>) => {
          const resultat = calculerDevis(params)

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
        description: 'Enregistre ou met à jour la demande du prospect en base de données.',
        inputSchema: enregistrerLeadParams,
        execute: async (params: z.infer<typeof enregistrerLeadParams>) => {
          const { data, error } = await supabaseAdmin
            .from('demandes')
            .insert({
              ...params,
              statut: 'nouveau_lead',
              score_completude: calculerScoreCompletude(params),
            })
            .select('id')
            .single()

          if (error) return { success: false, error: error.message }
          return { success: true, demande_id: data.id }
        },
      }),

      mettre_a_jour_statut: tool({
        description: 'Met à jour le statut d\'une demande dans le CRM.',
        inputSchema: mettreAJourStatutParams,
        execute: async (params: z.infer<typeof mettreAJourStatutParams>) => {
          const { error } = await supabaseAdmin
            .from('demandes')
            .update({ statut: params.statut, updated_at: new Date().toISOString() })
            .eq('id', params.demande_id)

          return { success: !error, error: error?.message }
        },
      }),

      escalader_humain: tool({
        description: 'Transfère le dossier à un commercial humain pour les cas complexes.',
        inputSchema: escaladerHumainParams,
        execute: async (params: z.infer<typeof escaladerHumainParams>) => {
          if (params.demande_id) {
            await supabaseAdmin
              .from('demandes')
              .update({ statut: 'cas_complexe', updated_at: new Date().toISOString() })
              .eq('id', params.demande_id)

            await supabaseAdmin.from('logs').insert({
              demande_id: params.demande_id,
              action: 'escalade_humain',
              outil_utilise: 'escalader_humain()',
              erreur: params.raison,
            })
          }

          return {
            success: true,
            message: 'Dossier transmis à l\'équipe commerciale. Un conseiller vous contactera sous 24h.',
          }
        },
      }),
    },
  })

  return result.toTextStreamResponse()
}

function calculerScoreCompletude(params: Record<string, unknown>): number {
  const champs = ['nom_prospect', 'email', 'telephone', 'nb_passagers', 'depart', 'destination', 'date_depart']
  const remplis = champs.filter(c => params[c] != null && params[c] !== '').length
  return Math.round((remplis / champs.length) * 100)
}
