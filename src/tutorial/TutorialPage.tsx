import { MDXProvider } from '@mdx-js/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { getLayer } from '../content/layers'
import { getTopic } from '../content/registry'
import type { TopicBundle } from '../content/topics'
import { ICONS } from '../map/icons'
import { formatHash } from '../router/useHashRoute'
import { SceneStage } from '../scene/SceneStage'
import { TopicContext } from './TopicContext'
import { mdxComponents } from './mdx-components'
import './tutorial.css'

interface Props {
  bundle: TopicBundle
  onBack(): void
  autoPlay?: boolean
  onSceneEnded?(): void
  /** faixa extra acima do conteúdo (barra do modo viagem) */
  banner?: ReactNode
}

export function TutorialPage({ bundle, onBack, autoPlay, onSceneEnded, banner }: Props) {
  const { meta, Scene, cues, audioSrc, Tutorial } = bundle
  const layer = getLayer(meta.layer)
  const Icon = ICONS[meta.id]
  const next = meta.next ? getTopic(meta.next) : undefined

  return (
    <TopicContext.Provider value={meta}>
      <article className="tutorial" style={{ ['--c' as string]: `var(${layer.colorVar})` }}>
        <div className="tutorial-bar">
          <button type="button" className="tutorial-back" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar ao mapa
          </button>
          <span className="tutorial-layer">{layer.label}</span>
        </div>
        {banner}
        <header className="tutorial-head">
          <div className="tutorial-icon">{Icon && <Icon size={26} strokeWidth={1.7} aria-hidden="true" />}</div>
          <h1>{meta.title}</h1>
          <p className="tutorial-lead">{meta.analogy}</p>
        </header>
        <div className="tutorial-scene">
          <SceneStage topicId={meta.id} Scene={Scene} cues={cues} audioSrc={audioSrc} autoPlay={autoPlay} onEnded={onSceneEnded} />
        </div>
        <div className="tutorial-body">
          <MDXProvider components={mdxComponents}>
            <Tutorial />
          </MDXProvider>
          <h2>Próximo assunto</h2>
          {next ? (
            <a className="tutorial-next" href={formatHash({ name: 'topic', id: next.id, journey: false })}>
              <span>
                <small>Continue por aqui</small>
                {next.title}
                <em>{next.analogy}</em>
              </span>
              <ArrowRight size={20} aria-hidden="true" />
            </a>
          ) : (
            <a className="tutorial-next" href="#/">
              <span>
                <small>Você chegou ao fim desta etapa</small>
                Voltar ao mapa
                <em>Experimente desligar as peças e ver o que muda.</em>
              </span>
              <ArrowRight size={20} aria-hidden="true" />
            </a>
          )}
        </div>
      </article>
    </TopicContext.Provider>
  )
}
