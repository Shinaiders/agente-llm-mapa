import { act, renderHook } from '@testing-library/react'
import { buildCues } from './cues'
import { FakeAudio, installFakeAudio } from './fake-audio'
import { useNarration } from './useNarration'

const cues = buildCues([
  { text: 'a', duration: 2 },
  { text: 'b', duration: 3 },
])

beforeEach(() => {
  vi.useFakeTimers()
  installFakeAudio()
})
afterEach(() => vi.useRealTimers())

const setup = () => renderHook(() => useNarration('/audio/x.m4a', cues))
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const play = async (r: ReturnType<typeof setup>) =>
  act(async () => {
    r.result.current.play()
    await Promise.resolve()
    await Promise.resolve()
  })

test('estado inicial: passo 0, parado, legenda da primeira frase', () => {
  const r = setup()
  expect(r.result.current).toMatchObject({ step: 0, playing: false, ended: false, caption: 'a', duration: 5.25, rate: 1 })
})

test('erro no áudio liga o relógio interno e os passos avançam mesmo assim', async () => {
  const r = setup()
  act(() => FakeAudio.last.emit('error'))
  await play(r)
  expect(r.result.current.usingFallbackClock).toBe(true)
  expect(r.result.current.playing).toBe(true)
  advance(2400)
  expect(r.result.current.step).toBe(1)
  expect(r.result.current.caption).toBe('b')
})

test('play() rejeitado pelo navegador também cai no relógio interno', async () => {
  FakeAudio.mode = 'reject'
  const r = setup()
  await play(r)
  expect(r.result.current.usingFallbackClock).toBe(true)
  expect(r.result.current.playing).toBe(true)
  advance(1000)
  expect(r.result.current.time).toBeCloseTo(1, 1)
})

test('com áudio funcionando, o tempo vem do áudio', async () => {
  const r = setup()
  await play(r)
  expect(r.result.current.usingFallbackClock).toBe(false)
  FakeAudio.last.currentTime = 2.5
  advance(50)
  expect(r.result.current.time).toBe(2.5)
  expect(r.result.current.step).toBe(1)
})

test('seek(2.3) leva step para 1 e caption para "b"', () => {
  const r = setup()
  act(() => r.result.current.seek(2.3))
  expect(r.result.current.step).toBe(1)
  expect(r.result.current.caption).toBe('b')
  expect(FakeAudio.last.currentTime).toBe(2.3)
  act(() => r.result.current.seek(0.5))
  expect(r.result.current.step).toBe(0)
})

test('seek fora dos limites é contido', () => {
  const r = setup()
  act(() => r.result.current.seek(-4))
  expect(r.result.current.time).toBe(0)
  act(() => r.result.current.seek(999))
  expect(r.result.current.time).toBe(5.25)
})

test('setRate(1.5) faz o relógio interno andar 1,5×', async () => {
  FakeAudio.mode = 'reject'
  const r = setup()
  act(() => r.result.current.setRate(1.5))
  await play(r)
  advance(1000)
  expect(r.result.current.time).toBeCloseTo(1.5, 1)
  expect(FakeAudio.last.playbackRate).toBe(1.5)
})

test('chega ao fim: ended vira true e para de tocar; restart volta ao começo', async () => {
  FakeAudio.mode = 'reject'
  const r = setup()
  await play(r)
  advance(6000)
  expect(r.result.current).toMatchObject({ ended: true, playing: false, time: 5.25, step: 1 })
  act(() => r.result.current.restart())
  expect(r.result.current).toMatchObject({ ended: false, time: 0, step: 0 })
})

test('stepProgress vai de 0 a 1 dentro da frase', () => {
  const r = setup()
  act(() => r.result.current.seek(1))
  expect(r.result.current.stepProgress).toBeCloseTo(0.5, 2)
  act(() => r.result.current.seek(2.1))
  expect(r.result.current.stepProgress).toBe(1)
})

test('sem cues não quebra', () => {
  const r = renderHook(() => useNarration('/audio/x.m4a', []))
  expect(r.result.current).toMatchObject({ step: -1, caption: '', duration: 0 })
})
