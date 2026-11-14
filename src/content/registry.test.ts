import { EDGES } from './edges'
import { LAYERS } from './layers'
import { TOPICS, getTopic } from './registry'

test('33 assuntos, 8 prontos com os ids combinados', () => {
  expect(TOPICS).toHaveLength(33)
  expect(
    TOPICS.filter((t) => t.status === 'ready')
      .map((t) => t.id)
      .sort(),
  ).toEqual(['cache', 'evals', 'fallback', 'fine-tuning', 'guardrails', 'llm', 'mcp', 'rag'])
})

test('quantidade por camada confere com o spec', () => {
  const n = (l: string) => TOPICS.filter((t) => t.layer === l).length
  expect(LAYERS.map((l) => l.id)).toEqual(['cerebro', 'conhecimento', 'acao', 'confiabilidade', 'seguranca', 'qualidade'])
  expect(LAYERS.map((l) => n(l.id))).toEqual([7, 6, 5, 3, 8, 4])
})

test('ids únicos; edges e next apontam para algo que existe', () => {
  const ids = TOPICS.map((t) => t.id)
  expect(new Set(ids).size).toBe(ids.length)
  const known = new Set([...ids, 'pergunta', 'resposta'])
  for (const e of EDGES) {
    expect(known.has(e.from), e.from).toBe(true)
    expect(known.has(e.to), e.to).toBe(true)
  }
  for (const t of TOPICS) if (t.next) expect(getTopic(t.next), t.next).toBeDefined()
})

test('todo assunto tem título, analogia e trecho de 2 a 4 linhas', () => {
  for (const t of TOPICS) {
    expect(t.title.length, t.id).toBeGreaterThan(1)
    expect(t.analogy.length, t.id).toBeGreaterThan(10)
    const lines = t.snippet.split('\n').length
    expect(lines, t.id).toBeGreaterThanOrEqual(2)
    expect(lines, t.id).toBeLessThanOrEqual(4)
  }
})

test('ordem de aprendizado dos prontos', () => {
  const order: string[] = []
  let cur = getTopic('llm')
  while (cur) {
    order.push(cur.id)
    cur = cur.next ? getTopic(cur.next) : undefined
  }
  expect(order).toEqual(['llm', 'guardrails', 'cache', 'rag', 'mcp', 'fallback', 'evals', 'fine-tuning'])
})
