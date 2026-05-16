'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/bookshelf` },
    })

    if (error) {
      setMessage('로그인 링크 전송에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } else {
      setMessage('이메일을 확인해주세요. 로그인 링크를 보내드렸습니다.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-2">나의 책장</h1>
        <p className="text-gray-500 text-center text-sm mb-6">AI 독서 비서</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="이메일을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? '전송 중...' : '로그인 링크 받기'}
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-sm text-center ${
              message.includes('실패') ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
