import { Ticket } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getTopic } from './content/registry'
import { type TopicBundle, loadTopic } from './content/topics'
import type { TopicId } from './content/types'
import { JourneyBanner, TRANSIT_MS, useJourney } from './journey/JourneyController'
import { MapScreen } from './map/MapScreen'
import { useMapSim } from './map/useMapSim'
import { useReducedMotion } from './map/useMedia'
import { useHashRoute } from './router/useHashRoute'
import { type OriginRect, TutorialOverlay } from './tutorial/TutorialOverlay'

interface Props {
  /** carregador de assunto; trocável nos testes */
  load?: (id: TopicId) => Promise<TopicBundle>
}

const nodeEl = (id: string) => document.querySelector<HTMLElement>(`[data-topic="${id}"]`)

export default function App({ load = loadTopic }: Props) {
  const [route, go] = useHashRoute()
  const [notice, setNotice] = useState<string | null>(null)
  const [origin, setOrigin] = useState<OriginRect | null>(null)
  const lastOpen = useRef<string | null>(null)
  const reducedMotion = useReducedMotion()

  const topic = route.name === 'topic' ? getTopic(route.id) : undefined
  const openId = topic?.status === 'ready' ? topic.id : null

  const rememberOrigin = useCallback((id: TopicId) => {
    const r = nodeEl(id)?.getBoundingClientRect()
    setOrigin(r && r.width ? { top: r.top, left: r.left, right: r.right, bottom: r.bottom } : null)
  }, [])

  const journey = useJourney({
    route,
    go,
    reducedMotion,
    onArrive: rememberOrigin,
    onFinished: useCallback(() => setNotice('Viagem concluída. Agora experimente desligar uma peça e viajar de novo.'), []),
  })
  const sim = useMapSim(openId !== null || journey.transit !== null)

  // rota que não leva a um assunto pronto: volta ao mapa e explica
  useEffect(() => {
    if (route.name !== 'topic' || openId) return
    setNotice(topic ? `${topic.title} chega na próxima etapa` : 'Assunto não encontrado')
    go({ name: 'map' })
  }, [route, openId, topic, go])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(null), 7000)
    return () => clearTimeout(id)
  }, [notice])

  // ao fechar o tutorial, o foco volta para o nó de onde ele saiu
  useEffect(() => {
    if (openId) {
      lastOpen.current = openId
    } else if (lastOpen.current) {
      nodeEl(lastOpen.current)?.focus()
      lastOpen.current = null
    }
  }, [openId])

  const open = useCallback(
    (id: TopicId) => {
      rememberOrigin(id)
      setNotice(null)
      go({ name: 'topic', id, journey: false })
    },
    [go, rememberOrigin],
  )
  const back = useCallback(() => {
    if (journey.active) journey.exit()
    else go({ name: 'map' })
  }, [journey, go])

  const inJourney = journey.active && openId === journey.order[journey.index]
  const transitTo = journey.transit ? getTopic(journey.transit.to)?.title : null
  const message = transitTo ? `Próxima parada: ${transitTo}` : notice

  return (
    <>
      <div className="app-map" inert={openId !== null}>
        <MapScreen
          sim={sim}
          onOpen={open}
          transit={journey.transit ? { ...journey.transit, ms: TRANSIT_MS } : null}
          actions={
            <button
              type="button"
              className="journey-start"
              onClick={() => {
                setNotice(null)
                journey.start(sim.result)
              }}
              disabled={journey.transit !== null}
            >
              <Ticket size={17} aria-hidden="true" />
              Viajar com o pedido
            </button>
          }
          notice={
            message && (
              <p className="map-notice" role="status">
                {message}
              </p>
            )
          }
        />
      </div>
      <AnimatePresence>
        {openId && (
          <TutorialOverlay
            key="tutorial"
            id={openId}
            load={load}
            onBack={back}
            origin={origin}
            autoPlay={inJourney}
            onSceneEnded={inJourney ? journey.sceneEnded : undefined}
            banner={inJourney ? <JourneyBanner journey={journey} /> : undefined}
          />
        )}
      </AnimatePresence>
    </>
  )
}
