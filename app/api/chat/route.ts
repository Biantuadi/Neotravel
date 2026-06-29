import { gateway, streamText } from 'ai'

export const maxDuration = 30
export const runtime = 'nodejs'

const SYSTEM = `Tu es l'assistant de NeoTravel, une entreprise française de transport de groupes en autocar.
Sur la page d'accueil, tu aides les visiteurs à comprendre nos services et à initier une demande de devis.
Réponds en français, de façon concise (2-3 phrases max), chaleureuse et professionnelle.
Pose UNE seule question à la fois pour guider le visiteur.
Si le visiteur est intéressé par un devis, collecte : départ, destination, date, nombre de passagers.
Ne calcule aucun prix toi-même — indique que l'équipe enverra un devis personnalisé.`

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4-5'),
    system: SYSTEM,
    messages,
  })

  return result.toTextStreamResponse()
}
