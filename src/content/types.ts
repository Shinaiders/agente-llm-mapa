export type LayerId = 'cerebro' | 'conhecimento' | 'acao' | 'confiabilidade' | 'seguranca' | 'qualidade'
export type TopicId = string

export interface Layer {
  id: LayerId
  label: string
  colorVar: string
}

export interface TopicMeta {
  id: TopicId
  title: string
  layer: LayerId
  status: 'ready' | 'soon'
  /** 2 a 4 linhas de código mostradas no nó */
  snippet: string
  /** uma frase */
  analogy: string
  /** próximo na ordem de aprendizado */
  next?: TopicId
}

export type EdgeEnd = TopicId | 'pergunta' | 'resposta'

export interface Edge {
  from: EdgeEnd
  to: EdgeEnd
  kind: 'main' | 'side'
}
