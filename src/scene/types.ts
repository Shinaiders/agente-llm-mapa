import type { FC } from 'react'

export interface SceneProps {
  /** índice da frase que está sendo narrada */
  step: number
  /** 0..1 dentro da frase atual */
  stepProgress: number
  reducedMotion: boolean
}

/**
 * Regra das cenas: a cena é função pura de `step`. Cada elemento declara seu
 * estado-alvo por passo; nada de sequências imperativas nem estado acumulado.
 * Assim, arrastar a barra para qualquer ponto mostra a cena certa.
 */
export type SceneComponent = FC<SceneProps>
