import type { Layer, LayerId } from './types'

export const LAYERS: Layer[] = [
  { id: 'cerebro', label: 'Cérebro', colorVar: '--layer-cerebro' },
  { id: 'conhecimento', label: 'Conhecimento', colorVar: '--layer-conhecimento' },
  { id: 'acao', label: 'Ação', colorVar: '--layer-acao' },
  { id: 'confiabilidade', label: 'Confiabilidade', colorVar: '--layer-confiabilidade' },
  { id: 'seguranca', label: 'Segurança', colorVar: '--layer-seguranca' },
  { id: 'qualidade', label: 'Qualidade e custo', colorVar: '--layer-qualidade' },
]

export function getLayer(id: LayerId): Layer {
  return LAYERS.find((l) => l.id === id)!
}
