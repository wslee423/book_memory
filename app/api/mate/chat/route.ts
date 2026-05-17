import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/rag/embed'
import { searchSimilar, buildSources } from '@/lib/rag/search'
import { buildSystemPrompt, buildContextBlock, buildUserMessage } from '@/lib/rag/prompts'
import { getOpenAI, CHAT_MODEL, MAX_TOKENS } from '@/lib/openai/client'
import type { ChatSource } from '@/types'

interface ChatRequestBody {
  message: string
  sessionId: string
}

async function saveChatMessages(
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
  sources: ChatSource[],
) {
  const supabase = await createClient()
  await supabase.schema('book_memory').from('chat_history').insert([
    { session_id: sessionId, role: 'user', content: userMessage, sources: null },
    {
      session_id: sessionId,
      role: 'assistant',
      content: assistantMessage,
      sources: sources.length > 0 ? sources : null,
    },
  ])
}

export async function POST(request: Request) {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  let body: ChatRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: '요청 형식이 잘못되었습니다.' }, { status: 400 })
  }

  const { message, sessionId } = body
  if (!message?.trim() || !sessionId) {
    return NextResponse.json({ data: null, error: '메시지와 세션 ID가 필요합니다.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ data: null, error: '메시지가 너무 깁니다. (최대 2000자)' }, { status: 400 })
  }
  if (!/^[0-9a-f-]{36}$/.test(sessionId)) {
    return NextResponse.json({ data: null, error: '세션 ID 형식이 잘못되었습니다.' }, { status: 400 })
  }

  try {
    const TOP_K = 5

    // 1. 질문 임베딩
    const queryEmbedding = await embedText(message)

    // 2. 유사도 검색 (TOP_K * 2 후보에서 TOP_K 선택)
    const searchResults = await searchSimilar(queryEmbedding, TOP_K * 2)

    // 3. 출처 구성 및 컨텍스트 구성 (동일한 TOP_K 기준)
    const topResults = searchResults.slice(0, TOP_K)
    const sources = await buildSources(topResults, TOP_K)
    const contextBlock = buildContextBlock(topResults)
    const userMsg = buildUserMessage(message, contextBlock)
    const systemPrompt = buildSystemPrompt()

    // 5. OpenAI 스트리밍
    let fullResponse = ''

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // 첫 번째 청크: 출처 정보
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'sources', sources }) + '\n'))

        try {
          const openaiStream = await getOpenAI().chat.completions.create({
            model: CHAT_MODEL,
            max_tokens: MAX_TOKENS,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMsg },
            ],
          })

          for await (const chunk of openaiStream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              fullResponse += text
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', text }) + '\n'))
            }
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : '알 수 없는 오류'
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'error', message: errMsg }) + '\n'),
          )
        } finally {
          controller.close()
          saveChatMessages(sessionId, message, fullResponse, sources).catch(console.error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'RAG 처리 중 오류가 발생했습니다.'
    return NextResponse.json({ data: null, error: errMsg }, { status: 500 })
  }
}
