import { Captions, CaptionsOff, Pause, Play, RotateCcw } from 'lucide-react'
import type { Cue } from '../narration/cues'
import { type Narration, RATES } from '../narration/useNarration'

interface Props {
  narration: Narration
  cues: Cue[]
  captionsOn: boolean
  onToggleCaptions(): void
}

const fmtRate = (r: number) => `${String(r).replace('.', ',')}×`
const fmtTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function SceneControls({ narration: n, cues, captionsOn, onToggleCaptions }: Props) {
  const playLabel = n.playing ? 'Pausar' : n.ended ? 'Tocar de novo' : 'Tocar'
  const nextRate = () => n.setRate(RATES[(RATES.indexOf(n.rate) + 1) % RATES.length])

  return (
    <div className="scene-controls">
      <button type="button" className="scene-play" onClick={n.playing ? n.pause : n.play} aria-label={playLabel}>
        {n.playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
      </button>
      <div className="scene-bar">
        <input
          type="range"
          aria-label="Progresso da cena"
          min={0}
          max={n.duration || 1}
          step={0.05}
          value={n.time}
          onChange={(e) => n.seek(Number(e.target.value))}
          style={{ ['--p' as string]: `${n.duration ? (n.time / n.duration) * 100 : 0}%` }}
        />
        <div className="scene-ticks" aria-hidden="true">
          {cues.slice(1).map((c) => (
            <span key={c.index} style={{ left: `${(c.start / n.duration) * 100}%` }} />
          ))}
        </div>
      </div>
      <span className="scene-time">
        {fmtTime(n.time)} / {fmtTime(n.duration)}
      </span>
      <button type="button" className="scene-rate" onClick={nextRate} aria-label={`Velocidade ${fmtRate(n.rate)}`}>
        {fmtRate(n.rate)}
      </button>
      <button type="button" onClick={onToggleCaptions} aria-label="Legenda" aria-pressed={captionsOn}>
        {captionsOn ? <Captions size={18} aria-hidden="true" /> : <CaptionsOff size={18} aria-hidden="true" />}
      </button>
      <button type="button" onClick={n.restart} aria-label="Recomeçar">
        <RotateCcw size={17} aria-hidden="true" />
      </button>
    </div>
  )
}
