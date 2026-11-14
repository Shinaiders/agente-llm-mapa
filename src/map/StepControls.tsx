import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'

interface Props {
  hopIndex: number
  total: number
  playing: boolean
  onPlay(): void
  onPause(): void
  onNext(): void
  onPrev(): void
}

export function StepControls({ hopIndex, total, playing, onPlay, onPause, onNext, onPrev }: Props) {
  return (
    <div className="step-controls">
      <button type="button" onClick={onPrev} aria-label="Salto anterior" disabled={hopIndex === 0}>
        <SkipBack size={16} aria-hidden="true" />
      </button>
      <button type="button" className="step-play" onClick={playing ? onPause : onPlay} aria-label={playing ? 'Pausar' : 'Tocar'}>
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      </button>
      <button type="button" onClick={onNext} aria-label="Próximo salto" disabled={hopIndex >= total - 1}>
        <SkipForward size={16} aria-hidden="true" />
      </button>
      <span className="step-count">
        Salto {hopIndex + 1} de {total}
      </span>
    </div>
  )
}
