import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getTopic } from './content/registry'
import { type TopicBundle, loadTopic } from './content/topics'
import type { TopicId } from './content/types'
import { MapScreen } from './map/MapScreen'
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

  const topic = route.name === 'topic' ? getTopic(route.id) : undefined
  const openId = topic?.status === 'ready' ? topic.id : null

  // rota que não leva a um assunto pronto: volta ao mapa e explica
  useEffect(() => {
    if (route.name !== 'topic' || openId) return
    setNotice(topic ? `${topic.title} chega na próxima etapa` : 'Assunto não encontrado')
    go({ name: 'map' })
  }, [route, openId, topic, go])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(id)
  }, [notice])

  // ao fechar o tutorial, o foco volta para o nó de onde ele saiu
  useEffect(() => {
    if (openId) {
      lastOpen.current = openId
      setNotice(null)
    } else if (lastOpen.current) {
      nodeEl(lastOpen.current)?.focus()
      lastOpen.current = null
    }
  }, [openId])

  const open = useCallback(
    (id: TopicId) => {
      const r = nodeEl(id)?.getBoundingClientRect()
      setOrigin(r && r.width ? { top: r.top, left: r.left, right: r.right, bottom: r.bottom } : null)
      go({ name: 'topic', id, journey: false })
    },
    [go],
  )
  const back = useCallback(() => go({ name: 'map' }), [go])

  return (
    <>
      <div className="app-map" inert={openId !== null}>
        <MapScreen
          onOpen={open}
          notice={
            notice && (
              <p className="map-notice" role="status">
                {notice}
              </p>
            )
          }
        />
      </div>
      <AnimatePresence>{openId && <TutorialOverlay key="tutorial" id={openId} load={load} onBack={back} origin={origin} />}</AnimatePresence>
    </>
  )
}
