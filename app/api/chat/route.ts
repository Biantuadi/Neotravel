import { gateway, isStepCount, streamText, tool } from 'ai'
import { z } from 'zod'
import { SYSTEM_PROMPT } from '@/lib/agent/prompt'
import { tools as makeTools } from '@/lib/agent/tools'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { messages, demande_id } = await req.json()

  const coreMessages = (messages as { role: string; content: string }[]).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  let capturedDemandeId: string | undefined = demande_id as string | undefined

  // Use base tools, but override enregistrer_lead to capture demande_id
  const baseTools = makeTools(capturedDemandeId)

  const allTools = {
    ...baseTools,
    enregistrer_lead: tool({
      description: baseTools.enregistrer_lead.description,
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

        capturedDemandeId = data.id
        return { success: true, demande_id: data.id }
      },
    }),
  }

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    tools: allTools,
    stopWhen: isStepCount(10),
  })

  const textStream = result.toTextStreamResponse()

  // Re-stream, appending a DEMANDE_ID marker at end if a lead was created
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
