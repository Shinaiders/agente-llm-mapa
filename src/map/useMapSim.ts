import { useCallback, useEffect, useMemo, useState } from 'react'
import { simulate } from '../sim/simulate'
import { ALL_ON, type Enabled, type ScenarioId, type SimResult, type Toggleable } from '../sim/types'

export const HOP_MS = 900
export const LOOP_PAUSE_MS = 1500

export interface MapSim {
  scenario: ScenarioId
  enabled: Enabled
  result: SimResult
  hopIndex: number
  playing: boolean
  atEnd: boolean
  setScenario(s: ScenarioId): void
  toggle(k: Toggleable): void
  resetAll(): void
  play(): void
  pause(): void
  next(): void
  prev(): void
  restart(): void
}

/** `frozen` segura o relógio sem mexer no tocar/pausar da pessoa (tutorial aberto, viagem em trânsito). */
export function useMapSim(frozen = false): MapSim {
  const [scenario, setScenarioState] = useState<ScenarioId>('normal')
  const [enabled, setEnabled] = useState<Enabled>(ALL_ON)
  const [hopIndex, setHopIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  const result = useMemo(() => simulate(scenario, enabled), [scenario, enabled])
  const last = result.hops.length - 1
  const atEnd = hopIndex >= last

  useEffect(() => {
    if (!playing || frozen) return
    const id = setTimeout(() => setHopIndex(atEnd ? 0 : hopIndex + 1), atEnd ? LOOP_PAUSE_MS : HOP_MS)
    return () => clearTimeout(id)
  }, [playing, frozen, hopIndex, atEnd, result])

  const setScenario = useCallback((s: ScenarioId) => {
    setScenarioState(s)
    setHopIndex(0)
  }, [])
  const toggle = useCallback((k: Toggleable) => {
    setEnabled((e) => ({ ...e, [k]: !e[k] }))
    setHopIndex(0)
  }, [])
  const resetAll = useCallback(() => {
    setEnabled(ALL_ON)
    setHopIndex(0)
  }, [])
  const next = useCallback(() => {
    setPlaying(false)
    setHopIndex((i) => Math.min(i + 1, last))
  }, [last])
  const prev = useCallback(() => {
    setPlaying(false)
    setHopIndex((i) => Math.max(i - 1, 0))
  }, [])

  return {
    scenario,
    enabled,
    result,
    hopIndex: Math.min(hopIndex, last),
    playing,
    atEnd,
    setScenario,
    toggle,
    resetAll,
    play: useCallback(() => setPlaying(true), []),
    pause: useCallback(() => setPlaying(false), []),
    next,
    prev,
    restart: useCallback(() => setHopIndex(0), []),
  }
}
