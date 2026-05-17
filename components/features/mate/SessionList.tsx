'use client'

import type { ChatSession } from '@/types'

interface SessionListProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelect: (sessionId: string) => void
  onNew: () => void
}

export function SessionList({ sessions, activeSessionId, onSelect, onNew }: SessionListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNew}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          + 새 대화
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {sessions.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">대화 기록이 없습니다</p>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
              activeSessionId === session.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <p className="font-medium truncate">{session.title}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{session.lastMessage}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
