import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'

// 배치 임베딩은 scripts/embed-all.ts 로컬 스크립트로 실행.
// 이 Route는 추후 단건 재임베딩 트리거용으로 예약.
export async function POST() {
  const authResult = await requireUser()
  if (authResult.response) return authResult.response

  return NextResponse.json({ message: '배치 임베딩은 npm run embed 로 실행하세요.' })
}
