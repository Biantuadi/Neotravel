import { gateway, streamText } from 'ai'
import { SYSTEM_PROMPT } from '@/lib/agent/prompt'
import { tools } from '@/lib/agent/tools'

export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { messages, demande_id } = await req.json()

  // Convert simple {role, content} messages to CoreMessage format
  const coreMessages = (messages as { role: string; content: string }[]).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages: coreMessages,
    maxSteps: 10,
    tools: tools(demande_id),
  })

  return result.toTextStreamResponse()
}
