import { EDGES } from '../content/edges'
import { TOPICS } from '../content/registry'
import type { NodeId } from '../sim/types'
import { LANES, MAP_SIZE, edgePath, nodeBox, nodePosition, pathBetween } from './layout'

const overlap = (a: ReturnType<typeof nodeBox>, b: ReturnType<typeof nodeBox>) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

test('todo assunto e os dois terminais têm caixa dentro do mapa', () => {
  for (const id of [...TOPICS.map((t) => t.id), 'pergunta', 'resposta']) {
    const b = nodeBox(id)
    expect(b.x, id).toBeGreaterThanOrEqual(0)
    expect(b.y, id).toBeGreaterThanOrEqual(0)
    expect(b.x + b.w, id).toBeLessThanOrEqual(MAP_SIZE.w)
    expect(b.y + b.h, id).toBeLessThanOrEqual(MAP_SIZE.h)
    expect(nodePosition(id)).toEqual({ x: b.x + b.w / 2, y: b.y + b.h / 2 })
  }
})

test('nenhum par de nós se sobrepõe', () => {
  const ids = [...TOPICS.map((t) => t.id), 'pergunta', 'resposta']
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      expect(overlap(nodeBox(ids[i]), nodeBox(ids[j])), `${ids[i]} × ${ids[j]}`).toBe(false)
})

test('cada nó fica dentro da faixa da sua camada', () => {
  for (const t of TOPICS) {
    const lane = LANES.find((l) => l.id === t.layer)!
    const b = nodeBox(t.id)
    expect(b.y, t.id).toBeGreaterThanOrEqual(lane.y)
    expect(b.y + b.h, t.id).toBeLessThanOrEqual(lane.y + lane.h)
  }
})

test('os 8 prontos são estações (maiores); os outros são fichas', () => {
  for (const t of TOPICS) expect(nodeBox(t.id).w > 200, t.id).toBe(t.status === 'ready')
})

test('toda ligação e todo salto possível da simulação tem um caminho SVG', () => {
  for (const e of EDGES) expect(edgePath(e), `${e.from}>${e.to}`).toMatch(/^M[\d. -]+/)
  const pairs: [NodeId, NodeId][] = [
    ['pergunta', 'guardrails-in'], ['pergunta', 'cache'], ['pergunta', 'llm'],
    ['guardrails-in', 'cache'], ['guardrails-in', 'llm'], ['cache', 'llm'], ['cache', 'resposta'],
    ['llm', 'rag'], ['rag', 'llm'], ['llm', 'mcp'], ['mcp', 'llm'], ['llm', 'fallback'],
    ['fallback', 'guardrails-out'], ['fallback', 'resposta'], ['llm', 'guardrails-out'],
    ['llm', 'resposta'], ['guardrails-out', 'resposta'],
  ]
  for (const [a, b] of pairs) {
    const d = pathBetween(a, b)
    expect(d, `${a}>${b}`).toMatch(/^M[\d. -]+/)
    expect(d, `${a}>${b}`).not.toContain('NaN')
  }
})

test('ida e volta usam o mesmo traçado, invertido', () => {
  const first = (d: string) => d.match(/^M([\d.]+) ([\d.]+)/)!.slice(1).map(Number)
  const [x1, y1] = first(pathBetween('llm', 'rag'))
  const back = pathBetween('rag', 'llm')
  expect(back.endsWith(`${x1} ${y1}`)).toBe(true)
})
