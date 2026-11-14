import { VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getLayer } from '../content/layers'
import { getTopic } from '../content/registry'
import type { TopicId } from '../content/types'
import { useReducedMotion } from '../map/useMedia'
import type { Cue } from '../narration/cues'
import { useNarration } from '../narration/useNarration'
import { SceneControls } from './SceneControls'
import './scene.css'
import type { SceneComponent } from './types'

export interface SceneStageProps {
  topicId: TopicId
  Scene: SceneComponent
  cues: Cue[]
  audioSrc: string
  autoPlay?: boolean
  onEnded?(): void
}

export function SceneStage({ topicId, Scene, cues, audioSrc, autoPlay, onEnded }: SceneStageProps) {
  const n = useNarration(audioSrc, cues)
  const reducedMotion = useReducedMotion()
  const [captionsOn, setCaptionsOn] = useState(true)
  const topic = getTopic(topicId)
  const color = topic ? `var(${getLayer(topic.layer).colorVar})` : 'var(--paper)'

  const nRef = useRef(n)
  nRef.current = n

  useEffect(() => {
    if (autoPlay) nRef.current.play()
  }, [autoPlay, audioSrc])

  const endedRef = useRef(false)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded
  useEffect(() => {
    if (n.ended && !endedRef.current) onEndedRef.current?.()
    endedRef.current = n.ended
  }, [n.ended])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const cur = nRef.current
      if (e.key === ' ') {
        e.preventDefault()
        if (cur.playing) cur.pause()
        else cur.play()
      } else if (e.key === 'ArrowRight') {
        const next = cues[Math.min(cur.step + 1, cues.length - 1)]
        if (next) cur.seek(next.start)
      } else if (e.key === 'ArrowLeft') {
        const prev = cues[Math.max(cur.step - 1, 0)]
        if (prev) cur.seek(prev.start)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cues])

  return (
    <figure className="scene" style={{ ['--c' as string]: color }}>
      <div className="scene-stage">
        <Scene step={Math.max(n.step, 0)} stepProgress={n.stepProgress} reducedMotion={reducedMotion} />
        {n.usingFallbackClock && n.playing && (
          <p className="scene-nosound">
            <VolumeX size={14} aria-hidden="true" />
            Sem som: seguindo pela legenda
          </p>
        )}
      </div>
      <div className="scene-caption" aria-live="polite" hidden={!captionsOn}>
        {captionsOn && n.caption && <p key={n.step}>{n.caption}</p>}
      </div>
      <SceneControls narration={n} cues={cues} captionsOn={captionsOn} onToggleCaptions={() => setCaptionsOn((v) => !v)} />
    </figure>
  )
}
