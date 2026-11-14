import { EDGES } from '../content/edges'
import { TOPICS, getTopic } from '../content/registry'
import type { EdgeEnd } from '../content/types'
import { LANES, edgePath, nodeBox } from '../map/layout'
import { useTopic } from './TopicContext'

const name = (id: EdgeEnd) => (id === 'pergunta' ? 'Pergunta' : id === 'resposta' ? 'Resposta' : (getTopic(id)?.title ?? id))
const VIEW = { x: 0, y: LANES[1].y - 8, w: 1190, h: 808 - LANES[1].y + 8 }

/** Seção "Onde se encaixa": o mapa em miniatura com este assunto e os vizinhos acesos. */
export function OndeSeEncaixa() {
  const topic = useTopic()
  if (!topic) return null
  const from = EDGES.filter((e) => e.to === topic.id).map((e) => e.from)
  const to = EDGES.filter((e) => e.from === topic.id).map((e) => e.to)
  const lit = new Set<string>([topic.id, ...from, ...to])
  const stations: EdgeEnd[] = [...TOPICS.filter((t) => t.status === 'ready').map((t) => t.id), 'pergunta', 'resposta']
  const layerColor = (id: EdgeEnd) => {
    const t = getTopic(id)
    return t ? `var(${LANES.find((l) => l.id === t.layer)!.colorVar})` : 'var(--paper)'
  }

  return (
    <>
      <h2>Onde se encaixa</h2>
      <figure className="minimap" aria-label={`Onde ${topic.title} se encaixa no mapa`}>
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} role="presentation">
          {EDGES.map((e) => {
            const on = e.from === topic.id || e.to === topic.id
            return <path key={`${e.from}>${e.to}`} d={edgePath(e)} className="minimap-edge" data-on={on || undefined} data-side={e.kind === 'side' || undefined} />
          })}
          {stations.map((id) => {
            const b = nodeBox(id)
            const self = id === topic.id
            return (
              <g key={id} className="minimap-node" data-on={lit.has(id) || undefined} data-self={self || undefined} style={{ ['--c' as string]: layerColor(id) }}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={id === 'pergunta' || id === 'resposta' ? b.h / 2 : 14} />
                <text x={b.x + b.w / 2} y={b.y + b.h / 2} dominantBaseline="central" textAnchor="middle">
                  {name(id)}
                </text>
              </g>
            )
          })}
        </svg>
        <figcaption>
          {from.length > 0 && (
            <p>
              <strong>Recebe de:</strong> {from.map(name).join(', ')}
            </p>
          )}
          {to.length > 0 && (
            <p>
              <strong>Entrega para:</strong> {to.map(name).join(', ')}
            </p>
          )}
        </figcaption>
      </figure>
    </>
  )
}
