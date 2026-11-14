import type { CSSProperties, ReactNode } from 'react'
import { getLayer } from '../content/layers'
import type { TopicMeta } from '../content/types'
import { FALLBACK_ICON, ICONS } from './icons'

interface Props {
  topic: TopicMeta
  style?: CSSProperties
  dimmed?: boolean
  active?: boolean
  off?: boolean
  onOpen(id: string): void
  onHover?(id: string | null): void
  /** controles extras ao lado do nó (ex.: interruptor) */
  extra?: ReactNode
  /** balão mostrado acima do nó (ex.: o que entrou e saiu neste salto) */
  bubble?: ReactNode
}

export function MapNode({ topic, style, dimmed, active, off, onOpen, onHover, extra, bubble }: Props) {
  const layer = getLayer(topic.layer)
  const Icon = ICONS[topic.id] ?? FALLBACK_ICON
  const ready = topic.status === 'ready'
  const label = `${topic.title} — ${layer.label}${ready ? '' : ' (em breve)'}`

  return (
    <div
      className={ready ? 'node node-station' : 'node node-chip'}
      style={{ ...style, ['--c' as string]: `var(${layer.colorVar})` }}
      data-node={topic.id}
      data-active={active || undefined}
      data-off={off || undefined}
      data-dimmed={dimmed || undefined}
    >
      <button
        type="button"
        className="node-main"
        data-topic={topic.id}
        data-dimmed={dimmed || undefined}
        aria-label={label}
        aria-disabled={ready ? undefined : true}
        onClick={() => ready && onOpen(topic.id)}
        onMouseEnter={() => onHover?.(topic.id)}
        onMouseLeave={() => onHover?.(null)}
        onFocus={() => onHover?.(topic.id)}
        onBlur={() => onHover?.(null)}
      >
        <span className="node-head">
          <Icon className="node-icon" size={ready ? 17 : 15} strokeWidth={1.9} aria-hidden="true" />
          <span className="node-title">{topic.title}</span>
        </span>
        {ready && (
          <code className="node-snippet" aria-hidden="false">
            {topic.snippet}
          </code>
        )}
      </button>
      {extra}
      {bubble}
    </div>
  )
}
