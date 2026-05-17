'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { SessionList } from './SessionList'
import { MessageList, type Message } from './MessageList'
import { ChatInput } from './ChatInput'
import type { ChatSession, ChatSource, StreamChunk } from '@/types'

const uid = () => crypto.randomUUID()

interface MateClientProps {
  initialSessions: ChatSession[]
}

export function MateClient({ initialSessions }: MateClientProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startNewSession = useCallback(() => {
    setActiveSessionId(null)
    setMessages([])
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId)
    const res = await fetch(`/api/mate/history?sessionId=${sessionId}`)
    if (!res.ok) return
    const json = await res.json()
    if (json.data) setMessages(json.data)
  }, [])

  const handleSend = useCallback(
    async (userText: string) => {
      if (isStreaming) return

      const sessionId = activeSessionId ?? uid()
      if (!activeSessionId) setActiveSessionId(sessionId)

      const userMsg: Message = { id: uid(), role: 'user', content: userText }
      const assistantId = uid()
      const placeholderMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
      }

      setMessages((prev) => [...prev, userMsg, placeholderMsg])
      setIsStreaming(true)

      // 세션 목록 즉시 반영 (첫 메시지로 제목 설정)
      if (!activeSessionId) {
        const newSession: ChatSession = {
          id: sessionId,
          title: userText.slice(0, 40),
          lastMessage: userText.slice(0, 60),
          createdAt: new Date().toISOString(),
        }
        setSessions((prev) => [newSession, ...prev])
      }

      let sources: ChatSource[] = []
      let accumulated = ''

      try {
        const res = await fetch('/api/mate/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText, sessionId }),
        })

        if (!res.ok || !res.body) {
          throw new Error('서버 오류가 발생했습니다.')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const chunk = JSON.parse(line) as StreamChunk
              if (chunk.type === 'sources') {
                sources = chunk.sources
              } else if (chunk.type === 'text') {
                accumulated += chunk.text
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulated }
                      : m,
                  ),
                )
              } else if (chunk.type === 'error') {
                throw new Error(chunk.message)
              }
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '오류가 발생했습니다.'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: errMsg, streaming: false }
              : m,
          ),
        )
      } finally {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, streaming: false, sources }
              : m,
          ),
        )
        setIsStreaming(false)
      }
    },
    [activeSessionId, isStreaming],
  )

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 좌측: 세션 목록 (md 이상) */}
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white hidden md:block">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={loadSession}
          onNew={startNewSession}
        />
      </aside>

      {/* 우측: 대화 창 */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="border-b border-gray-200 px-4 py-2.5 bg-white flex items-center gap-2">
          {/* 모바일: 새 대화 버튼 */}
          <button
            onClick={startNewSession}
            className="md:hidden text-xs px-2 py-1 rounded border border-gray-300 text-gray-500 hover:text-gray-800 shrink-0"
          >
            + 새 대화
          </button>
          <h1 className="text-sm font-semibold text-gray-800 truncate">
            {activeSessionId
              ? sessions.find((s) => s.id === activeSessionId)?.title ?? '대화'
              : '새 대화'}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <p className="text-2xl">📚</p>
              <p className="text-gray-500 text-sm max-w-sm">
                읽은 책에서 남긴 메모와 하이라이트를 바탕으로 답변해 드릴게요.
              </p>
              <div className="flex flex-col gap-2 text-xs text-gray-400">
                <p>예시: 불편함을 피하려 할 때 생기는 문제에 대해 읽었던 내용 찾아줘</p>
                <p>예시: 자산관리 관련해서 읽은 책들의 핵심 메모 정리해줘</p>
                <p>예시: 최근 별점 5개 준 책들의 공통점을 분석해줘</p>
              </div>
            </div>
          ) : (
            <MessageList messages={messages} bottomRef={bottomRef} />
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
