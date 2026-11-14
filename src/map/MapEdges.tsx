import { EDGES } from '../content/edges'
import { LANES, MAP_SIZE, edgePath } from './layout'

interface Props {
  /** ligações em destaque (chave "de>para"); as outras ficam apagadas quando há destaque */
  highlight?: Set<string>
}

export function MapEdges({ highlight }: Props) {
  return (
    <svg className="map-svg" width={MAP_SIZE.w} height={MAP_SIZE.h} viewBox={`0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`} aria-hidden="true">
      <defs>
        <marker id="arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L7 4 L1 7" fill="none" stroke="context-stroke" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {LANES.map((lane, i) => (
        <g key={lane.id}>
          <rect x={0} y={lane.y} width={MAP_SIZE.w} height={lane.h} className="lane-band" style={{ fill: `var(${lane.colorVar})` }} data-odd={i % 2 === 1 || undefined} />
          <line x1={0} x2={MAP_SIZE.w} y1={lane.y} y2={lane.y} className="lane-rule" />
          <text x={16} y={lane.y + 20} className="lane-label" style={{ fill: `var(${lane.colorVar})` }}>
            {lane.label}
          </text>
        </g>
      ))}
      {EDGES.map((e) => {
        const key = `${e.from}>${e.to}`
        const off = highlight && !highlight.has(key)
        return <path key={key} d={edgePath(e)} className={`edge edge-${e.kind}`} data-dimmed={off || undefined} markerEnd="url(#arrow)" />
      })}
    </svg>
  )
}
