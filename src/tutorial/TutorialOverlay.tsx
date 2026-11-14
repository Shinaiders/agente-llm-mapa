import { motion } from 'motion/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { TopicBundle } from '../content/topics'
import type { TopicId } from '../content/types'
import { useReducedMotion } from '../map/useMedia'
import { TutorialPage } from './TutorialPage'

export interface OriginRect {
  top: number
  left: number
  right: number
  bottom: number
}

interface Props {
  id: TopicId
  load(id: TopicId): Promise<TopicBundle>
  onBack(): void
  /** retângulo do nó de onde o tutorial "cresce" */
  origin?: OriginRect | null
  autoPlay?: boolean
  onSceneEnded?(): void
  banner?: ReactNode
}

type State = { status: 'loading' } | { status: 'ready'; bundle: TopicBundle } | { status: 'error' }

const clipFrom = (o: OriginRect) =>
  `inset(${o.top}px ${Math.max(window.innerWidth - o.right, 0)}px ${Math.max(window.innerHeight - o.bottom, 0)}px ${o.left}px round 14px)`
const FULL = 'inset(0px 0px 0px 0px round 0px)'

export function TutorialOverlay({ id, load, onBack, origin, autoPlay, onSceneEnded, banner }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const reduced = useReducedMotion()
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    load(id).then(
      (bundle) => alive && setState({ status: 'ready', bundle }),
      () => alive && setState({ status: 'error' }),
    )
    scroller.current?.scrollTo?.({ top: 0 })
    return () => {
      alive = false
    }
  }, [id, load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onBack()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack])

  const grow = origin && !reduced
  return (
    <motion.div
      ref={scroller}
      className="tutorial-overlay"
      initial={grow ? { clipPath: clipFrom(origin), opacity: 1 } : { opacity: 0 }}
      animate={grow ? { clipPath: FULL, opacity: 1 } : { opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: grow ? 0.55 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {state.status === 'ready' && (
        <TutorialPage key={state.bundle.meta.id} bundle={state.bundle} onBack={onBack} autoPlay={autoPlay} onSceneEnded={onSceneEnded} banner={banner} />
      )}
      {state.status === 'loading' && <p className="tutorial-status">Abrindo…</p>}
      {state.status === 'error' && (
        <div className="tutorial-status">
          <p>Não consegui carregar este assunto. Recarregue a página ou volte ao mapa.</p>
          <button type="button" className="tutorial-back" onClick={onBack}>
            Voltar ao mapa
          </button>
        </div>
      )}
    </motion.div>
  )
}
