import { RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { getTopic } from '../content/registry'
import type { TopicId, TopicMeta } from '../content/types'
import { getScenario } from '../sim/scenarios'
import { type NodeId, TOGGLEABLE, type Toggleable } from '../sim/types'
import { MapView } from './MapView'
import { Pulse, TransitPulse } from './Pulse'
import { ResultPanel } from './ResultPanel'
import { ScenarioBar } from './ScenarioBar'
import { StepControls } from './StepControls'
import { topicOfNode } from './layout'
import './map-screen.css'
import { type MapSim, HOP_MS, useMapSim } from './useMapSim'
import { useNarrow, useReducedMotion } from './useMedia'

interface Props {
  onOpen(id: TopicId): void
  /** simulação controlada de fora (modo viagem); sem ela, o mapa cuida da própria */
  sim?: MapSim
  /** botões extras na barra de cima */
  actions?: ReactNode
  /** aviso mostrado acima do mapa */
  notice?: ReactNode
  /** viagem: o cartão está correndo entre dois assuntos */
  transit?: { from: TopicId; to: TopicId; ms: number } | null
}

const isToggleable = (id: string): id is Toggleable => (TOGGLEABLE as string[]).includes(id)

export function MapScreen({ onOpen, sim: external, actions, notice, transit }: Props) {
  const own = useMapSim()
  const sim = external ?? own
  const reducedMotion = useReducedMotion()
  const narrow = useNarrow()
  const hop = sim.result.hops[sim.hopIndex]
  const activeTopic = topicOfNode(hop.node)
  const off = new Set(TOGGLEABLE.filter((k) => !sim.enabled[k]))
  const done = sim.hopIndex === sim.result.hops.length - 1

  const nodeExtra = (t: TopicMeta) => {
    if (!isToggleable(t.id)) return null
    const on = sim.enabled[t.id]
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${t.title} ${on ? 'ligado' : 'desligado'}`}
        title={on ? 'Desligar esta peça' : 'Ligar esta peça'}
        className="node-switch"
        onClick={() => sim.toggle(t.id as Toggleable)}
      >
        <span />
      </button>
    )
  }

  const nodeBubble = (t: TopicMeta) =>
    t.id === activeTopic && !transit ? (
      <div className="hop-bubble" data-status={hop.status}>
        <span className="hop-in">{hop.input}</span>
        <span className="hop-out">{hop.output}</span>
      </div>
    ) : null

  return (
    <div className="map-screen">
      <header className="map-top">
        <div className="map-brand">
          <h1>Mapa do Agente</h1>
          <p>Siga um pedido por dentro do Pip, o atendente da pizzaria. Clique numa peça para abrir o tutorial; desligue uma para ver o que muda.</p>
        </div>
        <ScenarioBar value={sim.scenario} onChange={sim.setScenario} />
        {actions && <div className="map-actions">{actions}</div>}
      </header>
      {notice}
      <div className="map-stage">
        <div className="map-canvas">
          <MapView activeNode={transit ? (transit.to as NodeId) : hop.node} off={off} onOpen={onOpen} nodeExtra={nodeExtra} nodeBubble={nodeBubble}>
            {!narrow && transit && <TransitPulse from={transit.from} to={transit.to} ms={transit.ms} reducedMotion={reducedMotion} />}
            {!narrow && !transit && <Pulse hops={sim.result.hops} hopIndex={sim.hopIndex} travelMs={HOP_MS - 150} reducedMotion={reducedMotion} />}
          </MapView>
        </div>
        <aside className="map-dock">
          <ResultPanel question={getScenario(sim.scenario).question} result={sim.result} done={done}>
            <div className="dock-controls">
              <StepControls
                hopIndex={sim.hopIndex}
                total={sim.result.hops.length}
                playing={sim.playing}
                onPlay={sim.play}
                onPause={sim.pause}
                onNext={sim.next}
                onPrev={sim.prev}
              />
              {off.size > 0 && (
                <button type="button" className="reset-all" onClick={sim.resetAll}>
                  <RotateCcw size={14} aria-hidden="true" />
                  Ligar tudo de novo
                </button>
              )}
            </div>
            {narrow && (
              <p className="result-where">
                Agora em: <strong>{getTopic(activeTopic)?.title ?? (activeTopic === 'pergunta' ? 'Pergunta' : 'Resposta')}</strong> — {hop.output}
              </p>
            )}
          </ResultPanel>
        </aside>
      </div>
    </div>
  )
}
