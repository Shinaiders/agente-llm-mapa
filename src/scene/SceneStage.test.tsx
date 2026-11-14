import { act, fireEvent, render, screen } from '@testing-library/react'
import { buildCues } from '../narration/cues'
import { FakeAudio, installFakeAudio } from '../narration/fake-audio'
import { SceneStage } from './SceneStage'
import type { SceneProps } from './types'

const cues = buildCues([
  { text: 'Primeira frase.', duration: 2 },
  { text: 'Segunda frase.', duration: 3 },
  { text: 'Terceira frase.', duration: 2 },
]) // inícios: 0 · 2.25 · 5.5 — fim: 7.5

const seen: SceneProps[] = []
function TestScene(p: SceneProps) {
  seen.push(p)
  return (
    <div data-testid="scene" data-step={p.step}>
      {p.step >= 1 && <span>apareceu no passo 1</span>}
      {p.step >= 2 && <span>apareceu no passo 2</span>}
    </div>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  installFakeAudio()
  FakeAudio.mode = 'reject' // sem som: o relógio interno conduz
  seen.length = 0
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const setup = (props: Partial<Parameters<typeof SceneStage>[0]> = {}) =>
  render(<SceneStage topicId="llm" Scene={TestScene} cues={cues} audioSrc="/audio/x.m4a" {...props} />)
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 50) act(() => void vi.advanceTimersByTime(50))
}
const flush = () => act(async () => void (await Promise.resolve()))
const bar = () => screen.getByRole('slider', { name: 'Progresso da cena' })
const scene = () => screen.getByTestId('scene')

test('seek para trás devolve a cena ao passo anterior, sem sobras', () => {
  setup()
  const initial = scene().outerHTML
  fireEvent.change(bar(), { target: { value: '6' } })
  expect(scene()).toHaveAttribute('data-step', '2')
  expect(screen.getByText('apareceu no passo 2')).toBeInTheDocument()
  fireEvent.change(bar(), { target: { value: '0.5' } })
  expect(scene()).toHaveAttribute('data-step', '0')
  expect(scene().outerHTML).toBe(initial)
})

test('legenda mostra a frase atual e tem aria-live="polite"', () => {
  setup()
  const caption = screen.getByText('Primeira frase.')
  expect(caption.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  fireEvent.change(bar(), { target: { value: '3' } })
  expect(screen.getByText('Segunda frase.')).toBeInTheDocument()
  expect(screen.queryByText('Primeira frase.')).not.toBeInTheDocument()
})

test('tocar e pausar', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'Tocar' }))
  await flush()
  expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  advance(2500)
  expect(scene()).toHaveAttribute('data-step', '1')
  fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
  advance(4000)
  expect(scene()).toHaveAttribute('data-step', '1')
})

test('velocidade passa pelas 4 opções', () => {
  setup()
  const labels: string[] = []
  for (let i = 0; i < 5; i++) {
    const b = screen.getByRole('button', { name: /^Velocidade/ })
    labels.push(b.textContent!)
    fireEvent.click(b)
  }
  expect(labels).toEqual(['1×', '1,25×', '1,5×', '0,75×', '1×'])
})

test('recomeçar volta ao início; legenda liga e desliga', () => {
  setup()
  fireEvent.change(bar(), { target: { value: '6' } })
  fireEvent.click(screen.getByRole('button', { name: 'Recomeçar' }))
  expect(scene()).toHaveAttribute('data-step', '0')
  const toggle = screen.getByRole('button', { name: 'Legenda' })
  expect(toggle).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(screen.queryByText('Primeira frase.')).not.toBeInTheDocument()
})

test('espaço toca/pausa; setas ←/→ vão para a frase anterior/próxima', async () => {
  setup()
  fireEvent.keyDown(window, { key: ' ' })
  await flush()
  expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  fireEvent.keyDown(window, { key: ' ' })
  expect(screen.getByRole('button', { name: 'Tocar' })).toBeInTheDocument()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(scene()).toHaveAttribute('data-step', '1')
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(scene()).toHaveAttribute('data-step', '2')
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  expect(scene()).toHaveAttribute('data-step', '1')
})

test('onEnded dispara uma vez ao fim', async () => {
  const onEnded = vi.fn()
  setup({ onEnded })
  fireEvent.click(screen.getByRole('button', { name: 'Tocar' }))
  await flush()
  advance(9000)
  expect(onEnded).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Tocar de novo' })).toBeInTheDocument()
})

test('autoPlay começa a tocar sozinho', async () => {
  setup({ autoPlay: true })
  await flush()
  expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
})

test('sem áudio, avisa que está seguindo pela legenda', async () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'Tocar' }))
  await flush()
  expect(screen.getByText(/Sem som/)).toBeInTheDocument()
})

test('com prefers-reduced-motion a cena recebe reducedMotion=true', () => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {},
  }))
  setup()
  expect(seen.at(-1)!.reducedMotion).toBe(true)
})

test('sem prefers-reduced-motion a cena recebe reducedMotion=false', () => {
  setup()
  expect(seen.at(-1)!.reducedMotion).toBe(false)
})
