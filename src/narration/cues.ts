export interface Cue {
  index: number
  text: string
  start: number
  end: number
}

/** silêncio entre frases, em segundos */
export const GAP = 0.25

const ms = (n: number) => Math.round(n * 1000) / 1000

export function buildCues(lines: { text: string; duration: number }[], gap = GAP): Cue[] {
  let t = 0
  return lines.map((line, index) => {
    const start = ms(t)
    const end = ms(start + line.duration)
    t = end + gap
    return { index, text: line.text, start, end }
  })
}

/** Frase que está valendo no instante t. No silêncio entre frases, vale a anterior. */
export function cueIndexAt(cues: Cue[], t: number): number {
  if (cues.length === 0) return -1
  let current = 0
  for (const cue of cues) {
    if (t >= cue.start) current = cue.index
    else break
  }
  return current
}

export function totalDuration(cues: Cue[]): number {
  return cues.length ? cues[cues.length - 1].end : 0
}
