import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TOPICS } from '../content/registry'
import { MapView } from './MapView'

const nodes = () => screen.getAllByRole('button').filter((b) => b.hasAttribute('data-topic'))

test('renderiza os 33 nós com nome acessível "<título> — <camada>"', () => {
  render(<MapView onOpen={() => {}} />)
  expect(nodes()).toHaveLength(33)
  expect(screen.getByRole('button', { name: /^RAG — Conhecimento/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Guardrails — Confiabilidade/ })).toBeInTheDocument()
})

test('nó "em breve" tem aria-disabled, diz "em breve" e não abre', async () => {
  const onOpen = vi.fn()
  render(<MapView onOpen={onOpen} />)
  const soon = screen.getByRole('button', { name: /^Embeddings — Conhecimento/ })
  expect(soon).toHaveAttribute('aria-disabled', 'true')
  expect(soon).toHaveAccessibleName(/em breve/)
  await userEvent.click(soon)
  expect(onOpen).not.toHaveBeenCalled()
  expect(TOPICS.filter((t) => t.status === 'soon')).toHaveLength(25)
})

test('Enter num nó pronto chama onOpen(id)', async () => {
  const onOpen = vi.fn()
  render(<MapView onOpen={onOpen} />)
  screen.getByRole('button', { name: /^RAG — Conhecimento/ }).focus()
  await userEvent.keyboard('{Enter}')
  expect(onOpen).toHaveBeenCalledWith('rag')
})

test('nó pronto mostra o trecho de código', () => {
  render(<MapView onOpen={() => {}} />)
  const cache = screen.getByRole('button', { name: /^Cache — Qualidade e custo/ })
  expect(within(cache).getByText(/cache\.get\(chave\)/)).toBeInTheDocument()
})

test('passar o mouse num nó ligado apaga os que não têm ligação com ele', async () => {
  render(<MapView onOpen={() => {}} />)
  const by = (id: string) => document.querySelector(`[data-topic="${id}"]`)!
  await userEvent.hover(by('rag'))
  expect(by('rag')).not.toHaveAttribute('data-dimmed')
  expect(by('llm')).not.toHaveAttribute('data-dimmed')
  expect(by('cache')).toHaveAttribute('data-dimmed', 'true')
  expect(by('embeddings')).toHaveAttribute('data-dimmed', 'true')
  await userEvent.unhover(by('rag'))
  expect(by('cache')).not.toHaveAttribute('data-dimmed')
})

test('as seis camadas aparecem com nome', () => {
  render(<MapView onOpen={() => {}} />)
  for (const name of ['Cérebro', 'Conhecimento', 'Ação', 'Confiabilidade', 'Segurança', 'Qualidade e custo'])
    expect(screen.getAllByText(name).length).toBeGreaterThan(0)
})
