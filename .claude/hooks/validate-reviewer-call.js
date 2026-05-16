#!/usr/bin/env node
/**
 * PreToolUse hook — Reviewer Isolation Enforcer
 *
 * Reviewer subagent는 구현 reasoning 없이 git diff + QUALITY_SCORE.md만으로 판정해야 한다.
 * 이 hook은 Agent(subagent_type="reviewer") 호출 전에 prompt를 스캔하여
 * reasoning 오염이 감지되면 호출 자체를 차단한다.
 *
 * 프로젝트 초기화 시 .claude/hooks/validate-reviewer-call.js 로 복사.
 * .claude/settings.json 에 PreToolUse hook으로 등록 필요.
 */

const fs = require('fs')

// ── 허용 필드 (이것만 reviewer prompt에 포함 가능) ───────────────────────────
const ALLOWED_FIELDS = [
  'DIFF_RANGE:',
  'QUALITY_SCORE_PATH:',
  'PRODUCT_SPEC_PATH:',
  'CHANGED_FILES:',
  'PREVIOUS_FAIL_REPORT:',  // 재시도 시 이전 FAIL 보고서는 허용
]

// ── Reasoning 오염 신호어 ────────────────────────────────────────────────────
// 다음 패턴이 reviewer prompt 에 포함되면 차단.
// 의도적으로 구체적인 multi-word 패턴만 사용하여 false positive 최소화.
const REASONING_PATTERNS = [
  // 한국어
  '구현 의도', '설계 의도', '변경 의도',
  '이렇게 한 이유', '이렇게 구현한 이유', '이렇게 했는데',
  '왜냐하면',
  '때문에 이렇게 했',
  '배경 설명', '컨텍스트 설명',
  '의도를 설명', '의도: ',
  '이번 변경의 목적', '이번 변경의 이유',
  // 영어
  'implementation rationale',
  'the reason for this change',
  'the reason i ',
  'i decided to',
  'i implemented this because',
  'i chose to',
  'this was designed to',
  'background:', 'rationale:',
]

// ────────────────────────────────────────────────────────────────────────────

function allow() {
  process.exit(0)
}

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }))
  process.exit(0)
}

// stdin 읽기
let raw
try {
  raw = fs.readFileSync(0, 'utf8').trim()
} catch {
  allow() // stdin 읽기 실패 시 통과 (hook 오류로 작업 차단하지 않음)
}

if (!raw) allow()

let input
try {
  input = JSON.parse(raw)
} catch {
  allow() // JSON 파싱 실패 시 통과
}

const toolName = input.tool_name || ''
const toolInput = input.tool_input || {}

// Agent 호출이 아니면 통과
if (toolName !== 'Agent') allow()

// reviewer subagent 호출이 아니면 통과
const subagentType = (toolInput.subagent_type || '').toLowerCase()
if (subagentType !== 'reviewer') allow()

const prompt = toolInput.prompt || ''
const promptLower = prompt.toLowerCase()

// ── 검사 1: Reasoning 오염 신호어 탐지 ──────────────────────────────────────
const foundPatterns = REASONING_PATTERNS.filter(p =>
  promptLower.includes(p.toLowerCase())
)

if (foundPatterns.length > 0) {
  block(
    `[REVIEWER ISOLATION VIOLATION] reasoning 오염 감지\n` +
    `감지된 패턴: ${foundPatterns.join(' / ')}\n\n` +
    `원인: Orchestrator가 reviewer prompt에 구현 의도/reasoning을 포함했습니다.\n` +
    `수정: orchestrate.md §"Reviewer 호출 포맷"에 따라 아래 필드만 사용하세요.\n\n` +
    `  DIFF_RANGE: <범위>\n` +
    `  QUALITY_SCORE_PATH: <경로>\n` +
    `  PRODUCT_SPEC_PATH: <경로 또는 NONE>\n` +
    `  CHANGED_FILES:\n` +
    `    - <파일 목록>`
  )
}

// ── 검사 2: 허용 필드 외 자유 텍스트 감지 ───────────────────────────────────
// ALLOWED_FIELDS가 하나도 없으면 structured format이 아닌 것으로 판단
const hasStructuredFormat = ALLOWED_FIELDS.some(f =>
  prompt.includes(f)
)

if (!hasStructuredFormat) {
  block(
    `[REVIEWER FORMAT VIOLATION] structured format 없음\n\n` +
    `Reviewer 호출 prompt에 허용 필드(DIFF_RANGE:, QUALITY_SCORE_PATH: 등)가 없습니다.\n` +
    `자유 텍스트 형식의 reviewer 호출은 reasoning 오염 위험으로 차단됩니다.\n\n` +
    `수정: orchestrate.md §"Reviewer 호출 포맷"을 사용하세요.\n\n` +
    `  DIFF_RANGE: <범위>\n` +
    `  QUALITY_SCORE_PATH: <경로>\n` +
    `  PRODUCT_SPEC_PATH: <경로 또는 NONE>\n` +
    `  CHANGED_FILES:\n` +
    `    - <파일 목록>`
  )
}

// 통과
allow()
