import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream, UIMessage } from 'ai'
import { SYSTEM_PROMPT } from '@/lib/agent/prompt'
import { tools } from '@/lib/agent/tools'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, demande_id }: { messages: UIMessage[]; demande_id?: string } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(10),
    tools: tools(demande_id),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.fullStream }),
  })
}
