import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import type { TopicBundle } from '../content/topics'
import { getTopic } from '../content/registry'
import { buildCues } from '../narration/cues'
import { installFakeAudio } from '../narration/fake-audio'
import { CodeBlock } from './CodeBlock'
import { OndeSeEncaixa } from './MiniMap'

const fakeLoad = async (id: string): Promise<TopicBundle> => ({
  meta: getTopic(id)!,
  Scene: ({ step }) => <div data-testid="scene">passo {step}</div>,
  cues: buildCues([{ text: 'Frase um.', duration: 2 }]),
  audioSrc: `/audio/${id}.m4a`,
  Tutorial: () => (
    <>
      <h2>O que é</h2>
      <p>Explicação.</p>
      <h2>Para que serve</h2>
      <OndeSeEncaixa />
      <h2>Como montar</h2>
      <h2>Erros comuns</h2>
    </>
  ),
})

beforeEach(() => {
  installFakeAudio()
  window.location.hash = ''
})

const open = async (hash: string, load = fakeLoad) => {
  window.location.hash = hash
  const r = render(<App load={load} />)
  await act(async () => void (await Promise.resolve()))
  return r
}

test('id inexistente volta ao mapa com o aviso "Assunto não encontrado"', async () => {
  await open('#/assunto/xyz')
  expect(screen.getByRole('status')).toHaveTextContent('Assunto não encontrado')
  expect(screen.getByRole('radiogroup', { name: 'Cenário' })).toBeInTheDocument()
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  expect(window.location.hash).toBe('#/')
})

test('assunto "em breve" volta ao mapa com o aviso "<título> chega na próxima etapa"', async () => {
  await open('#/assunto/embeddings')
  expect(screen.getByRole('status')).toHaveTextContent('Embeddings chega na próxima etapa')
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})

test('abre o assunto: título, analogia, cena e as seções na ordem', async () => {
  await open('#/assunto/rag')
  const page = await screen.findByRole('article')
  expect(screen.getByRole('heading', { level: 1, name: 'RAG' })).toBeInTheDocument()
  expect(page).toHaveTextContent('Consultar o cardápio antes de responder')
  expect(screen.getByTestId('scene')).toBeInTheDocument()
  const h2 = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
  expect(h2).toEqual(['O que é', 'Para que serve', 'Onde se encaixa', 'Como montar', 'Erros comuns', 'Próximo assunto'])
})

test('"Onde se encaixa" diz de onde recebe e para onde entrega', async () => {
  await open('#/assunto/cache')
  await screen.findByRole('article')
  const fig = screen.getByRole('figure', { name: /Onde Cache se encaixa/ })
  expect(fig).toHaveTextContent('Recebe de: Guardrails')
  expect(fig).toHaveTextContent('Entrega para: LLM, Resposta')
})

test('"Próximo assunto" aponta para meta.next; o último volta ao mapa', async () => {
  const r = await open('#/assunto/rag')
  await screen.findByRole('article')
  expect(screen.getByRole('link', { name: /Memória/ })).toHaveAttribute('href', '#/assunto/memoria')
  r.unmount()
  await open('#/assunto/prompt-injection')
  await screen.findByRole('article')
  expect(screen.getByRole('link', { name: /Voltar ao mapa/ })).toHaveAttribute('href', '#/')
})

test('Esc e o botão "Voltar ao mapa" voltam; o foco retorna ao nó de origem', async () => {
  await open('#/assunto/rag')
  await screen.findByRole('article')
  fireEvent.keyDown(window, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('article')).not.toBeInTheDocument())
  expect(window.location.hash).toBe('#/')
  expect(document.activeElement).toBe(document.querySelector('[data-topic="rag"]'))

  fireEvent.click(document.querySelector('[data-topic="cache"]')!)
  await screen.findByRole('article')
  expect(window.location.hash).toBe('#/assunto/cache')
  fireEvent.click(screen.getByRole('button', { name: 'Voltar ao mapa' }))
  await waitFor(() => expect(screen.queryByRole('article')).not.toBeInTheDocument())
  expect(document.activeElement).toBe(document.querySelector('[data-topic="cache"]'))
})

test('com o tutorial aberto, o mapa fica inerte', async () => {
  await open('#/assunto/rag')
  await screen.findByRole('article')
  expect(document.querySelector('.map-screen')!.closest('[inert]')).not.toBeNull()
})

test('falha ao carregar mostra aviso e caminho de volta', async () => {
  await open('#/assunto/rag', async () => {
    throw new Error('boom')
  })
  expect(await screen.findByText(/Não consegui carregar este assunto/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Voltar ao mapa' })).toBeInTheDocument()
})

test('bloco de código tem botão "Copiar" que grava o texto no clipboard', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  render(<CodeBlock code={'const a = 1\nconst b = 2'} lang="ts" />)
  expect(screen.getByText(/const a = 1/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
  expect(writeText).toHaveBeenCalledWith('const a = 1\nconst b = 2')
  expect(await screen.findByRole('button', { name: 'Copiado' })).toBeInTheDocument()
})
