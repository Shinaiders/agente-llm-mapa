import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MapScreen } from './MapScreen'
import { HOP_MS } from './useMapSim'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const setup = () => render(<MapScreen onOpen={() => {}} />)
const runToEnd = () => {
  const next = () => screen.getByRole('button', { name: 'Próximo salto' }) as HTMLButtonElement
  while (!next().disabled) fireEvent.click(next())
}

test('seletor mostra os 6 cenários, com "Pedido normal" marcado', () => {
  setup()
  const radios = within(screen.getByRole('radiogroup', { name: 'Cenário' })).getAllByRole('radio')
  expect(radios.map((r) => r.textContent)).toEqual([
    'Pedido normal', 'Pergunta repetida', 'Tentativa de golpe', 'Modelo fora do ar', 'Pergunta sobre o cardápio', 'Pedido que precisa de ferramenta',
  ])
  expect(radios[0]).toHaveAttribute('aria-checked', 'true')
})

test('escolher "Tentativa de golpe" faz o painel dizer "Barrado"', () => {
  setup()
  fireEvent.click(screen.getByRole('radio', { name: 'Tentativa de golpe' }))
  runToEnd()
  const panel = screen.getByRole('region', { name: 'Resultado' })
  expect(within(panel).getByText('Barrado')).toBeInTheDocument()
  expect(within(panel).getByText(/não posso passar dados de outros clientes/)).toBeInTheDocument()
})

test('interruptor só existe nos 5 nós da simulação e tem role="switch"', () => {
  setup()
  const switches = screen.getAllByRole('switch')
  expect(switches.map((s) => s.getAttribute('aria-label')).sort()).toEqual(
    ['Cache ligado', 'Fallback e retry ligado', 'Guardrails ligado', 'MCP ligado', 'RAG ligado'].sort(),
  )
  for (const s of switches) expect(s).toHaveAttribute('aria-checked', 'true')
})

test('desligar guardrails no golpe: o painel passa a dizer "Resposta errada" e o nó fica marcado como desligado', () => {
  setup()
  fireEvent.click(screen.getByRole('radio', { name: 'Tentativa de golpe' }))
  fireEvent.click(screen.getByRole('switch', { name: 'Guardrails ligado' }))
  expect(screen.getByRole('switch', { name: 'Guardrails desligado' })).toHaveAttribute('aria-checked', 'false')
  expect(document.querySelector('[data-node="guardrails"]')).toHaveAttribute('data-off', 'true')
  runToEnd()
  expect(within(screen.getByRole('region', { name: 'Resultado' })).getByText('Resposta errada')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ligar tudo de novo' }))
  expect(screen.getByRole('switch', { name: 'Guardrails ligado' })).toBeInTheDocument()
})

test('painel mostra resposta, tempo, custo e a nota "valores ilustrativos"', () => {
  setup()
  runToEnd()
  const panel = screen.getByRole('region', { name: 'Resultado' })
  expect(within(panel).getByText('Deu certo')).toBeInTheDocument()
  expect(within(panel).getByText(/aberto até as 23h/)).toBeInTheDocument()
  expect(within(panel).getByText('1,3 s')).toBeInTheDocument()
  expect(within(panel).getByText('US$ 0,004')).toBeInTheDocument()
  expect(within(panel).getByText(/valores ilustrativos/i)).toBeInTheDocument()
})

test('antes de o pedido chegar ao fim, o painel mostra a pergunta e não o resultado', () => {
  setup()
  const panel = screen.getByRole('region', { name: 'Resultado' })
  expect(within(panel).getByText(/Até que horas vocês ficam abertos/)).toBeInTheDocument()
  expect(within(panel).queryByText('Deu certo')).not.toBeInTheDocument()
})

test('passo a passo: avançar pausa e mostra "Salto 2 de 6"; o nó ativo mostra o que recebeu e devolveu', () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'Próximo salto' }))
  expect(screen.getByText('Salto 2 de 6')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tocar' })).toBeInTheDocument()
  const node = document.querySelector('[data-node="guardrails"]')!
  expect(node).toHaveAttribute('data-active', 'true')
  expect(within(node as HTMLElement).getByText('Pode passar')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Salto anterior' }))
  expect(screen.getByText('Salto 1 de 6')).toBeInTheDocument()
})

test('tocando sozinho, o pedido chega ao fim e o resultado aparece', () => {
  setup()
  for (let t = 0; t < HOP_MS * 5; t += 50) act(() => void vi.advanceTimersByTime(50))
  expect(within(screen.getByRole('region', { name: 'Resultado' })).getByText('Deu certo')).toBeInTheDocument()
})
