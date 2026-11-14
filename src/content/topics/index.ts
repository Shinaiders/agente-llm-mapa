import type { FC } from 'react'
import type { Cue } from '../../narration/cues'
import type { SceneComponent } from '../../scene/types'
import { getTopic } from '../registry'
import type { TopicId, TopicMeta } from '../types'

export interface TopicBundle {
  meta: TopicMeta
  Scene: SceneComponent
  cues: Cue[]
  Tutorial: FC
  audioSrc: string
}

const scenes = import.meta.glob<{ default: SceneComponent }>('./*/Scene.tsx')
const tutorials = import.meta.glob<{ default: FC }>('./*/tutorial.mdx')
const cueFiles = import.meta.glob<{ default: Cue[] }>('./*/cues.json')

/** Carrega sob demanda a cena, o tutorial e os cues de um assunto pronto. */
export async function loadTopic(id: TopicId): Promise<TopicBundle> {
  const meta = getTopic(id)
  const scene = scenes[`./${id}/Scene.tsx`]
  const tutorial = tutorials[`./${id}/tutorial.mdx`]
  const cues = cueFiles[`./${id}/cues.json`]
  if (!meta || !scene || !tutorial || !cues) throw new Error(`Assunto incompleto: ${id}`)
  const [s, t, c] = await Promise.all([scene(), tutorial(), cues()])
  return { meta, Scene: s.default, Tutorial: t.default, cues: c.default, audioSrc: `${import.meta.env.BASE_URL}audio/${id}.m4a` }
}
