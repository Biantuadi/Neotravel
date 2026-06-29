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

  let capturedDemandeId: string | undefined = demande_id as string | undefined

  // On utilise directement les outils complets (enregistrer_lead fait déjà l'upsert clients)
  const allTools = makeTools(capturedDemandeId)

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    tools: allTools,
    stopWhen: isStepCount(10),
    onStepFinish({ toolResults }) {
      // Capturer le demande_id dès qu'enregistrer_lead répond
      for (const tr of (toolResults ?? [])) {
        if (tr.toolName === 'enregistrer_lead' && 'output' in tr) {
          const res = (tr as { output: Record<string, unknown> }).output
          if (res?.demande_id) capturedDemandeId = res.demande_id as string
        }
      }
    },
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
            if (capturedDemandeId) {
              controller.enqueue(new TextEncoder().encode(` DEMANDE_ID:${capturedDemandeId} `))
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
