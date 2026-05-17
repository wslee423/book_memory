'use client'

import { SourceCard } from './SourceCard'
import type { ChatSource } from '@/types'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  streaming?: boolean
}

interface MessageListProps {
  messages: Message[]
  bottomRef: React.RefObject<HTMLDivElement>
}

export function MessageList({ messages, bottomRef }: MessageListProps) {
  return (
    <div className="flex flex-col gap-4 py-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {msg.content}
            {msg.streaming && (
              <span className="inline-block ml-1 animate-pulse">▍</span>
            )}
          </div>

          {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && !msg.streaming && (
            <div className="max-w-[80%] flex flex-col gap-2 w-full">
              <p className="text-xs text-gray-400 px-1">참조한 독서 기록</p>
              {msg.sources.map((src, i) => (
                <SourceCard key={i} source={src} />
              ))}
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
