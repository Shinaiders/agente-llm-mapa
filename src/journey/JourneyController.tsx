import { ChevronRight, SkipForward } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getTopic } from '../content/registry'
import type { TopicId } from '../content/types'
import type { Route } from '../router/useHashRoute'
import type { SimResult } from '../sim/types'
import { journeyOrder } from './journey'
import './journey.css'

/** tempo do cartão correndo no mapa entre duas paradas */
export const TRANSIT_MS = 1400
const AUTO_KEY = 'viagem-auto'

function readAuto(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) !== '0'
  } catch {
    return true
  }
}

export interface Transit {
  from: TopicId
  to: TopicId
}

export interface Journey {
  active: boolean
  order: TopicId[]
  index: number
  /** o cartão está correndo no mapa entre duas paradas */
  transit: Transit | null
  /** a cena acabou e o avanço automático está desligado */
  waiting: boolean
  auto: boolean
  setAuto(on: boolean): void
  start(result: SimResult): void
  /** a cena da parada atual terminou */
  sceneEnded(): void
  advance(): void
  exit(): void
}

interface Options {
  route: Route
  go(r: Route): void
  /** chamado quando a viagem passa da última parada */
  onFinished(): void
  /** chamado logo antes de abrir uma parada (para a transição saber de onde crescer) */
  onArrive?(id: TopicId): void
  reducedMotion: boolean
}

export function useJourney({ route, go, onFinished, onArrive, reducedMotion }: Options): Journey {
  const [state, setState] = useState<{ order: TopicId[]; index: number } | null>(null)
  const [transit, setTransit] = useState<Transit | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [auto, setAutoState] = useState(readAuto)

  const setAuto = useCallback((on: boolean) => {
    setAutoState(on)
    try {
      localStorage.setItem(AUTO_KEY, on ? '1' : '0')
    } catch {
      /* sem armazenamento: vale só para esta visita */
    }
  }, [])

  const exit = useCallback(() => {
    setState(null)
    setTransit(null)
    setWaiting(false)
    go({ name: 'map' })
  }, [go])

  const start = useCallback(
    (result: SimResult) => {
      const order = journeyOrder(result)
      if (order.length === 0) return
      setState({ order, index: 0 })
      setTransit(null)
      setWaiting(false)
      onArrive?.(order[0])
      go({ name: 'topic', id: order[0], journey: true })
    },
    [go, onArrive],
  )

  const advance = useCallback(() => {
    if (!state || transit) return
    const next = state.index + 1
    setWaiting(false)
    if (next >= state.order.length) {
      setState(null)
      go({ name: 'map' })
      onFinished()
      return
    }
    setTransit({ from: state.order[state.index], to: state.order[next] })
    setState({ order: state.order, index: next })
    go({ name: 'map' })
  }, [state, transit, go, onFinished])

  const sceneEnded = useCallback(() => {
    if (!state) return
    if (auto) advance()
    else setWaiting(true)
  }, [state, auto, advance])

  // o cartão corre no mapa e, ao chegar, a próxima cena abre
  useEffect(() => {
    if (!transit) return
    const id = setTimeout(
      () => {
        onArrive?.(transit.to)
        setTransit(null)
        go({ name: 'topic', id: transit.to, journey: true })
      },
      reducedMotion ? 500 : TRANSIT_MS,
    )
    return () => clearTimeout(id)
  }, [transit, go, onArrive, reducedMotion])

  // a pessoa saiu do roteiro por conta própria (voltar do navegador, outro link): encerra a viagem
  useEffect(() => {
    if (!state || transit) return
    const expected = state.order[state.index]
    if (route.name !== 'topic' || route.id !== expected) {
      setState(null)
      setWaiting(false)
    }
  }, [route, state, transit])

  return {
    active: state !== null,
    order: state?.order ?? [],
    index: state?.index ?? 0,
    transit,
    waiting,
    auto,
    setAuto,
    start,
    sceneEnded,
    advance,
    exit,
  }
}

export function JourneyBanner({ journey }: { journey: Journey }) {
  const { order, index } = journey
  return (
    <nav className="journey" aria-label="Viagem com o pedido">
      <span className="journey-count">
        Viagem · {index + 1} de {order.length}
      </span>
      <ol className="journey-stops">
        {order.map((id, i) => (
          <li key={id} data-state={i < index ? 'done' : i === index ? 'now' : 'next'} aria-current={i === index ? 'step' : undefined}>
            {i > 0 && <ChevronRight size={13} aria-hidden="true" />}
            {getTopic(id)?.title ?? id}
          </li>
        ))}
      </ol>
      <div className="journey-actions">
        {journey.waiting && (
          <button type="button" className="journey-continue" onClick={journey.advance}>
            Continuar viagem
          </button>
        )}
        <button type="button" role="switch" aria-checked={journey.auto} aria-label="Avanço automático" className="journey-auto" onClick={() => journey.setAuto(!journey.auto)}>
          <i aria-hidden="true" />
          Automático
        </button>
        <button type="button" className="journey-skip" onClick={journey.advance} aria-label="Pular">
          <SkipForward size={15} aria-hidden="true" />
          Pular
        </button>
      </div>
    </nav>
  )
}
