import { Maximize2, Minus, Plus } from 'lucide-react'
import { type ReactNode, useMemo, useRef, useState } from 'react'
import { EDGES } from '../content/edges'
import { LAYERS } from '../content/layers'
import { TOPICS, getTopic } from '../content/registry'
import type { TopicId, TopicMeta } from '../content/types'
import type { NodeId } from '../sim/types'
import { MapEdges } from './MapEdges'
import { MapNode } from './MapNode'
import { MAP_SIZE, nodeBox, topicOfNode } from './layout'
import './map.css'
import { useNarrow } from './useMedia'
import { usePanZoom } from './usePanZoom'

export interface MapViewProps {
  /** nó da simulação onde o cartão do pedido está agora */
  activeNode?: NodeId
  /** assuntos apagados por quem controla o mapa */
  dimmed?: Set<string>
  /** assuntos desligados no interruptor */
  off?: Set<string>
  onOpen(id: TopicId): void
  /** controles extras por nó (interruptor) */
  nodeExtra?(topic: TopicMeta): ReactNode
  /** balão acima de um nó */
  nodeBubble?(topic: TopicMeta): ReactNode
  /** camada extra dentro do mundo do mapa (o cartão do pedido) */
  children?: ReactNode
}

const neighbors = (id: string) => {
  const set = new Set<string>([id])
  for (const e of EDGES) {
    if (e.from === id) set.add(e.to)
    if (e.to === id) set.add(e.from)
  }
  return set
}

export function MapView({ activeNode, dimmed, off, onOpen, nodeExtra, nodeBubble, children }: MapViewProps) {
  const viewport = useRef<HTMLDivElement>(null)
  const narrow = useNarrow()
  const { view, fit, zoomIn, zoomOut, handlers } = usePanZoom(viewport, MAP_SIZE, !narrow)
  const [hovered, setHovered] = useState<string | null>(null)

  const linked = useMemo(() => (hovered && EDGES.some((e) => e.from === hovered || e.to === hovered) ? neighbors(hovered) : null), [hovered])
  const highlight = useMemo(
    () => (linked && hovered ? new Set(EDGES.filter((e) => e.from === hovered || e.to === hovered).map((e) => `${e.from}>${e.to}`)) : undefined),
    [linked, hovered],
  )
  const activeTopic = activeNode ? topicOfNode(activeNode) : null
  const hoveredTopic = hovered ? getTopic(hovered) : undefined

  const node = (t: TopicMeta, positioned: boolean) => {
    const box = nodeBox(t.id)
    return (
      <MapNode
        key={t.id}
        topic={t}
        style={positioned ? { position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h } : undefined}
        dimmed={(linked ? !linked.has(t.id) : false) || dimmed?.has(t.id)}
        active={activeTopic === t.id}
        off={off?.has(t.id)}
        onOpen={onOpen}
        onHover={setHovered}
        extra={nodeExtra?.(t)}
        bubble={nodeBubble?.(t)}
      />
    )
  }

  if (narrow) {
    return (
      <div className="map-stack">
        {LAYERS.map((layer) => (
          <section key={layer.id} className="stack-lane" style={{ ['--c' as string]: `var(${layer.colorVar})` }}>
            <h2 className="stack-label">{layer.label}</h2>
            <div className="stack-grid">{TOPICS.filter((t) => t.layer === layer.id).map((t) => node(t, false))}</div>
          </section>
        ))}
        {children}
      </div>
    )
  }

  const hoverBox = hoveredTopic && hoveredTopic.status !== 'ready' ? nodeBox(hoveredTopic.id) : null

  return (
    <div className="map-viewport" ref={viewport} {...handlers}>
      <div
        className="map-world"
        style={{ width: MAP_SIZE.w, height: MAP_SIZE.h, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        <MapEdges highlight={highlight} />
        <Terminal id="pergunta" label="Pergunta" active={activeTopic === 'pergunta'} />
        <Terminal id="resposta" label="Resposta" active={activeTopic === 'resposta'} />
        {TOPICS.map((t) => node(t, true))}
        {hoverBox && hoveredTopic && (
          <div className="hover-card" style={{ left: Math.min(hoverBox.x, MAP_SIZE.w - 300), top: hoverBox.y + hoverBox.h + 8 }} role="presentation">
            <p>{hoveredTopic.analogy}</p>
            <code>{hoveredTopic.snippet}</code>
            <span className="hover-soon">Chega na próxima etapa</span>
          </div>
        )}
        {children}
      </div>
      <div className="zoom-controls" role="group" aria-label="Zoom do mapa">
        <button type="button" onClick={zoomOut} aria-label="Afastar">
          <Minus size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={fit} aria-label="Ajustar à tela">
          <Maximize2 size={15} aria-hidden="true" />
        </button>
        <button type="button" onClick={zoomIn} aria-label="Aproximar">
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function Terminal({ id, label, active }: { id: 'pergunta' | 'resposta'; label: string; active: boolean }) {
  const box = nodeBox(id)
  return (
    <div className="terminal" data-terminal={id} data-active={active || undefined} style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
      {label}
    </div>
  )
}
