import { CircleAlert, CircleCheck, CircleX, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Outcome, SimResult } from '../sim/types'

const OUTCOME: Record<Outcome, { label: string; icon: ReactNode }> = {
  ok: { label: 'Deu certo', icon: <CircleCheck size={16} aria-hidden="true" /> },
  blocked: { label: 'Barrado', icon: <ShieldCheck size={16} aria-hidden="true" /> },
  wrong: { label: 'Resposta errada', icon: <CircleAlert size={16} aria-hidden="true" /> },
  error: { label: 'Erro', icon: <CircleX size={16} aria-hidden="true" /> },
}

export const formatMs = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`
export const formatCost = (c: number) => `US$ ${c.toFixed(3).replace('.', ',')}`

interface Props {
  question: string
  result: SimResult
  /** o pedido já chegou ao fim do caminho? */
  done: boolean
  children?: ReactNode
}

export function ResultPanel({ question, result, done, children }: Props) {
  const o = OUTCOME[result.outcome]
  return (
    <section className="result-panel" aria-label="Resultado">
      <p className="result-question">
        <span>Cliente</span>
        {question}
      </p>
      {children}
      <div className="result-body" aria-live="polite">
        {done ? (
          <>
            <div className="result-main">
              <span className="result-badge" data-outcome={result.outcome}>
                {o.icon}
                {o.label}
              </span>
              <p className="result-answer">{result.answer}</p>
            </div>
            <dl className="result-numbers">
              <div>
                <dt>Tempo</dt>
                <dd>{formatMs(result.ms)}</dd>
              </div>
              <div>
                <dt>Custo</dt>
                <dd>{formatCost(result.cost)}</dd>
              </div>
              <p className="result-note">Valores ilustrativos, só para comparar os caminhos.</p>
            </dl>
          </>
        ) : (
          <p className="result-wait">O pedido está a caminho…</p>
        )}
      </div>
    </section>
  )
}
