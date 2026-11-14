import { act, renderHook } from '@testing-library/react'
import { HOP_MS, LOOP_PAUSE_MS, useMapSim } from './useMapSim'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const path = (r: { current: ReturnType<typeof useMapSim> }) => r.current.result.hops.map((h) => h.node)
// em fatias: cada salto agenda o próximo só depois de o React renderizar
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 50) act(() => void vi.advanceTimersByTime(50))
}

test('começa no cenário normal, tudo ligado, tocando do primeiro salto', () => {
  const { result } = renderHook(() => useMapSim())
  expect(result.current).toMatchObject({ scenario: 'normal', hopIndex: 0, playing: true })
  expect(Object.values(result.current.enabled).every(Boolean)).toBe(true)
})

test('tocando, avança um salto a cada HOP_MS e recomeça depois da pausa no fim', () => {
  const { result } = renderHook(() => useMapSim())
  advance(HOP_MS * 2)
  expect(result.current.hopIndex).toBe(2)
  advance(HOP_MS * 3)
  expect(result.current.hopIndex).toBe(5) // último de 6
  advance(LOOP_PAUSE_MS)
  expect(result.current.hopIndex).toBe(0)
})

test('trocar cenário no meio do percurso zera o salto e troca o caminho', () => {
  const { result } = renderHook(() => useMapSim())
  advance(HOP_MS * 3)
  expect(result.current.hopIndex).toBe(3)
  act(() => result.current.setScenario('golpe'))
  expect(result.current.hopIndex).toBe(0)
  expect(path(result)).toEqual(['pergunta', 'guardrails-in'])
  advance(HOP_MS)
  expect(result.current.hopIndex).toBe(1)
  advance(HOP_MS * 3)
  expect(result.current.hopIndex).toBeLessThanOrEqual(1) // nunca passa do fim do caminho novo
})

test('desligar uma peça no meio do percurso zera o salto e a peça some do caminho', () => {
  const { result } = renderHook(() => useMapSim())
  advance(HOP_MS * 2)
  act(() => result.current.toggle('cache'))
  expect(result.current.hopIndex).toBe(0)
  expect(result.current.enabled.cache).toBe(false)
  expect(path(result)).not.toContain('cache')
  act(() => result.current.toggle('cache'))
  expect(path(result)).toContain('cache')
})

test('next() no último salto não passa do fim; prev() no primeiro não vai abaixo de 0', () => {
  const { result } = renderHook(() => useMapSim())
  act(() => result.current.pause())
  act(() => result.current.prev())
  expect(result.current.hopIndex).toBe(0)
  for (let i = 0; i < 20; i++) act(() => result.current.next())
  expect(result.current.hopIndex).toBe(result.current.result.hops.length - 1)
})

test('next() e prev() pausam; pausado, o tempo não avança', () => {
  const { result } = renderHook(() => useMapSim())
  act(() => result.current.next())
  expect(result.current).toMatchObject({ playing: false, hopIndex: 1 })
  advance(HOP_MS * 5)
  expect(result.current.hopIndex).toBe(1)
})

test('resetAll liga tudo de novo', () => {
  const { result } = renderHook(() => useMapSim())
  act(() => result.current.toggle('rag'))
  act(() => result.current.toggle('mcp'))
  act(() => result.current.resetAll())
  expect(Object.values(result.current.enabled).every(Boolean)).toBe(true)
})
