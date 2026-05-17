'use client'

import { useRef } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const value = textareaRef.current?.value.trim()
    if (!value || disabled) return
    onSend(value)
    if (textareaRef.current) textareaRef.current.value = ''
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          placeholder="독서 기록에서 찾고 싶은 내용을 질문하세요... (Enter 전송, Shift+Enter 줄바꿈)"
          rows={2}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors shrink-0"
        >
          전송
        </button>
      </div>
    </div>
  )
}
