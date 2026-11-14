export type ScenarioId = 'normal' | 'repetida' | 'golpe' | 'modelo-fora' | 'cardapio' | 'ferramenta'
export type Toggleable = 'guardrails' | 'cache' | 'rag' | 'mcp' | 'fallback'
export type Enabled = Record<Toggleable, boolean>

export const TOGGLEABLE: Toggleable[] = ['guardrails', 'cache', 'rag', 'mcp', 'fallback']
export const ALL_ON: Enabled = { guardrails: true, cache: true, rag: true, mcp: true, fallback: true }

export type NodeId =
  | 'pergunta'
  | 'guardrails-in'
  | 'cache'
  | 'llm'
  | 'rag'
  | 'mcp'
  | 'fallback'
  | 'guardrails-out'
  | 'resposta'

export type HopStatus = 'ok' | 'blocked' | 'skipped' | 'error'

export interface Hop {
  node: NodeId
  input: string
  output: string
  status: HopStatus
}

export type Outcome = 'ok' | 'blocked' | 'wrong' | 'error'

export interface SimResult {
  hops: Hop[]
  answer: string
  outcome: Outcome
  /** ilustrativo, não medido */
  ms: number
  /** ilustrativo, não medido */
  cost: number
}

export interface Scenario {
  id: ScenarioId
  label: string
  question: string
}
