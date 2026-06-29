import { isStepCount, streamText, gateway } from 'ai'
import { SYSTEM_PROMPT } from '@/lib/agent/prompt'
import { tools as makeTools } from '@/lib/agent/tools'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { messages, demande_id } = await req.json()

  const coreMessages = (messages as { role: string; content: string }[]).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Ref mutable partagée avec toutes les closures des tools.
  // enregistrer_lead met à jour demandeRef.current directement dans son execute,
  // ce qui permet aux tools suivants (calculer_devis, etc.) de lire le bon id.
  const demandeRef = { current: demande_id as string | undefined }

  const allTools = makeTools(demandeRef)

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    tools: allTools,
    stopWhen: isStepCount(10),
  })

  const textStream = result.toTextStreamResponse()

  // Re-stream avec marqueur DEMANDE_ID à la fin pour persistance côté client
  const responseStream = new ReadableStream({
    async start(controller) {
      const reader = textStream.body?.getReader()
      if (!reader) { controller.close(); return }
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            if (demandeRef.current) {
              controller.enqueue(new TextEncoder().encode(` DEMANDE_ID:${demandeRef.current} `))
            }
            controller.close()
            break
          }
          controller.enqueue(value)
        }
      } catch (e) {
        controller.error(e)
      }
    },
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
