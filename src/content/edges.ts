import type { Edge } from './types'

export const EDGES: Edge[] = [
  { from: 'pergunta', to: 'guardrails', kind: 'main' },
  { from: 'guardrails', to: 'cache', kind: 'main' },
  { from: 'cache', to: 'llm', kind: 'main' },
  { from: 'cache', to: 'resposta', kind: 'main' },
  { from: 'llm', to: 'rag', kind: 'main' },
  { from: 'llm', to: 'mcp', kind: 'main' },
  { from: 'llm', to: 'fallback', kind: 'main' },
  { from: 'llm', to: 'guardrails', kind: 'main' },
  { from: 'guardrails', to: 'resposta', kind: 'main' },
  { from: 'evals', to: 'llm', kind: 'side' },
  { from: 'fine-tuning', to: 'llm', kind: 'side' },
]
