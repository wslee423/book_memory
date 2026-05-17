import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/rag/embed'
import { searchSimilar, buildSources, fetchBookMap } from '@/lib/rag/search'
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
    // text-embedding-3-small 기준 0.3 미만은 주제 연관성이 낮음
    const MIN_SIMILARITY = 0.3

    // 1. 질문 임베딩
    const queryEmbedding = await embedText(message)

    // 2. 유사도 검색 (TOP_K * 2 후보 → 임계값 필터 → TOP_K 선택)
    const searchResults = await searchSimilar(queryEmbedding, TOP_K * 2)

    // 3. 책 정보 한 번만 조회 → 출처·컨텍스트 양쪽에 공유
    const topResults = searchResults
      .filter((r) => r.similarity >= MIN_SIMILARITY)
      .slice(0, TOP_K)
    const uniqueBookIds = Array.from(new Set(topResults.map((r) => r.bookId)))
    const bookMap = await fetchBookMap(uniqueBookIds)

    const sources = await buildSources(topResults, TOP_K, bookMap)
    const contextBlock = buildContextBlock(
      topResults.map((r) => ({
        content: r.content,
        bookTitle: bookMap.get(r.bookId)?.title ?? '알 수 없는 책',
        sourceType: r.sourceType,
      })),
    )
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
