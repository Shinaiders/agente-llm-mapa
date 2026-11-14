import { SCENARIOS } from '../sim/scenarios'
import type { ScenarioId } from '../sim/types'

interface Props {
  value: ScenarioId
  onChange(s: ScenarioId): void
}

export function ScenarioBar({ value, onChange }: Props) {
  return (
    <div className="scenario-bar" role="radiogroup" aria-label="Cenário">
      {SCENARIOS.map((s) => (
        <button key={s.id} type="button" role="radio" aria-checked={s.id === value} className="scenario-pill" onClick={() => onChange(s.id)}>
          {s.label}
        </button>
      ))}
    </div>
  )
}
