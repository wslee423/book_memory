import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

export const CHAT_MODEL = 'gpt-5.4-mini'
export const MAX_TOKENS = 2048
