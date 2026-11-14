import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { getTopic } from '../content/registry'
import type { TopicBundle } from '../content/topics'
import { buildCues } from '../narration/cues'
import { FakeAudio, installFakeAudio } from '../narration/fake-audio'
import { TRANSIT_MS } from './JourneyController'

const fakeLoad = async (id: string): Promise<TopicBundle> => ({
  meta: getTopic(id)!,
  Scene: ({ step }) => <div data-testid="scene">passo {step}</div>,
  cues: buildCues([{ text: `Narração de ${id}.`, duration: 2 }]),
  audioSrc: `/audio/${id}.m4a`,
  Tutorial: () => <h2>O que é</h2>,
})

beforeEach(() => {
  vi.useFakeTimers()
  installFakeAudio()
  FakeAudio.mode = 'reject'
  window.location.hash = ''
  localStorage.clear()
})
afterEach(() => {
  // o laço de animação do Motion guarda um quadro agendado entre testes; desmonto e deixo esse quadro rodar
  // antes de trocar o relógio, senão as animações de saída do teste seguinte nunca terminam
  cleanup()
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

const tick = async (ms: number) => {
  for (let t = 0; t < ms; t += 50)
    await act(async () => {
      vi.advanceTimersByTime(50)
      await Promise.resolve()
    })
}
const start = async () => {
  render(<App load={fakeLoad} />)
  fireEvent.click(screen.getByRole('button', { name: 'Viajar com o pedido' }))
  await tick(700)
}
// o mapa fica inerte atrás do tutorial (o jsdom não aplica inert às consultas), então olho só dentro do artigo
const inPage = () => within(screen.getByRole('article'))
const title = () => {
  const page = screen.queryByRole('article')
  return page ? within(page).getByRole('heading', { level: 1 }).textContent : undefined
}

test('começa pela primeira parada do cenário, tocando sozinha, com a barra da viagem', async () => {
  await start()
  expect(title()).toBe('Guardrails')
  expect(inPage().getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  const bar = screen.getByRole('navigation', { name: 'Viagem com o pedido' })
  expect(bar).toHaveTextContent('1 de 5')
  expect(bar).toHaveTextContent('Cache')
})

test('ao terminar uma cena: volta ao mapa, o cartão corre até o próximo nó, a próxima cena abre tocando', async () => {
  await start()
  await tick(2100) // a cena de 2 s termina
  await tick(400)
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(screen.getByTestId('transit')).toHaveAttribute('data-to', 'cache')
  expect(screen.getByRole('status')).toHaveTextContent('Próxima parada: Cache')
  await tick(TRANSIT_MS + 600)
  expect(title()).toBe('Cache')
  expect(inPage().getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Viagem com o pedido' })).toHaveTextContent('2 de 5')
})

test('"Avanço automático" desligado: para no fim da cena e mostra "Continuar viagem"', async () => {
  await start()
  fireEvent.click(screen.getByRole('switch', { name: 'Avanço automático' }))
  await tick(2600)
  expect(title()).toBe('Guardrails')
  fireEvent.click(screen.getByRole('button', { name: 'Continuar viagem' }))
  await tick(TRANSIT_MS + 1000)
  expect(title()).toBe('Cache')
})

test('a preferência de avanço automático fica guardada', async () => {
  await start()
  fireEvent.click(screen.getByRole('switch', { name: 'Avanço automático' }))
  expect(localStorage.getItem('viagem-auto')).toBe('0')
})

test('"Pular" vai direto à próxima; na última, encerra e volta ao mapa com "Viagem concluída"', async () => {
  await start()
  const seen = [title()]
  for (let i = 0; i < 4; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'Pular' }))
    await tick(TRANSIT_MS + 1000)
    seen.push(title())
  }
  expect(seen).toEqual(['Guardrails', 'Cache', 'LLM', 'Evals', 'Fine-tuning'])
  fireEvent.click(screen.getByRole('button', { name: 'Pular' }))
  await tick(800)
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Viagem concluída')
})

test('Esc sai da viagem a qualquer momento', async () => {
  await start()
  fireEvent.keyDown(window, { key: 'Escape' })
  await tick(2000 + TRANSIT_MS + 1500)
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(screen.queryByTestId('transit')).not.toBeInTheDocument()
  expect(screen.queryByRole('navigation', { name: 'Viagem com o pedido' })).not.toBeInTheDocument()
})

test('a viagem segue o cenário escolhido', async () => {
  render(<App load={fakeLoad} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Tentativa de golpe' }))
  fireEvent.click(screen.getByRole('button', { name: 'Viajar com o pedido' }))
  await tick(700)
  expect(screen.getByRole('navigation', { name: 'Viagem com o pedido' })).toHaveTextContent('1 de 3')
})
