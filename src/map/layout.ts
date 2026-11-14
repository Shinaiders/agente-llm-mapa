import { LAYERS } from '../content/layers'
import { TOPICS } from '../content/registry'
import type { Edge, EdgeEnd, LayerId } from '../content/types'
import type { NodeId } from '../sim/types'

export interface Point {
  x: number
  y: number
}
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export const MAP_SIZE = { w: 1760, h: 808 }

/** estação = nó do caminho principal, com trecho de código; ficha = os demais */
export const STATION = { w: 230, h: 112 }
export const CHIP = { w: 168, h: 56 }
const TERMINAL = { w: 140, h: 36 }

// Ordem das faixas no mapa (de cima para baixo), escolhida para o caminho
// principal fazer uma volta só: entra pela porta, sobe ao caderno, desce ao cérebro.
const LANE_ORDER: LayerId[] = ['seguranca', 'qualidade', 'confiabilidade', 'cerebro', 'conhecimento', 'acao']
const LANE_H: Record<LayerId, number> = { seguranca: 84, qualidade: 136, confiabilidade: 136, cerebro: 136, conhecimento: 136, acao: 136 }
const TOP = 28

export const LANES: { id: LayerId; label: string; colorVar: string; y: number; h: number }[] = (() => {
  let y = TOP
  return LANE_ORDER.map((id) => {
    const layer = LAYERS.find((l) => l.id === id)!
    const lane = { id, label: layer.label, colorVar: layer.colorVar, y, h: LANE_H[id] }
    y += LANE_H[id]
    return lane
  })
})()


// colunas das estações e início da área das fichas
const COL = [180, 430, 680, 930]
const CHIPS_X = 1210
const CHIP_STEP = 180

const STATION_COL: Record<string, number> = {
  guardrails: 0,
  cache: 1,
  'fine-tuning': 1,
  fallback: 2,
  llm: 2,
  rag: 2,
  evals: 3,
  mcp: 3,
}

const boxes = new Map<string, Box>()

for (const lane of LANES) {
  const inLane = TOPICS.filter((t) => t.layer === lane.id)
  for (const t of inLane.filter((t) => t.status === 'ready')) {
    boxes.set(t.id, { x: COL[STATION_COL[t.id]], y: lane.y + (lane.h - STATION.h) / 2, ...STATION })
  }
  const chips = inLane.filter((t) => t.status !== 'ready')
  const single = lane.h < 136 // faixa baixa: uma fileira só, a partir da esquerda
  const perRow = single ? chips.length : Math.ceil(chips.length / 2)
  chips.forEach((t, i) => {
    const row = single ? 0 : Math.floor(i / perRow)
    const col = single ? i : i % perRow
    const x = (single ? COL[0] : CHIPS_X) + col * CHIP_STEP
    const y = single ? lane.y + (lane.h - CHIP.h) / 2 : lane.y + 7 + row * (CHIP.h + 10)
    boxes.set(t.id, { x, y, ...CHIP })
  })
}

const door = boxes.get('guardrails')!
const IN_Y = door.y + 34
const OUT_Y = door.y + 78
boxes.set('pergunta', { x: 16, y: IN_Y - TERMINAL.h / 2, ...TERMINAL })
boxes.set('resposta', { x: 16, y: OUT_Y - TERMINAL.h / 2, ...TERMINAL })

export function nodeBox(id: EdgeEnd): Box {
  const b = boxes.get(id)
  if (!b) throw new Error(`nó sem posição: ${id}`)
  return b
}

export function nodePosition(id: EdgeEnd): Point {
  const b = nodeBox(id)
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}

/** NodeId da simulação → assunto (ou terminal) desenhado no mapa */
export function topicOfNode(node: NodeId): EdgeEnd {
  return node === 'guardrails-in' || node === 'guardrails-out' ? 'guardrails' : node
}

// ── Traçados ────────────────────────────────────────────────────────────────

const b = (id: string) => nodeBox(id)
const G = b('guardrails')
const C = b('cache')
const L = b('llm')
const F = b('fallback')
const R = b('rag')
const M = b('mcp')
const E = b('evals')
const FT = b('fine-tuning')
const P = b('pergunta')
const TERM_X = P.x + P.w // borda direita dos terminais
const CH = (TERM_X + G.x) / 2 // canal entre os terminais e a porta
const cx = (box: Box) => box.x + box.w / 2
const cy = (box: Box) => box.y + box.h / 2
const UNDER_DOOR = G.y + G.h + 11

type Pts = [number, number][]

// Cada traçado é uma lista de pontos; os cantos são arredondados na hora de desenhar.
const ROUTES: Record<string, Pts> = {
  'pergunta>guardrails-in': [[TERM_X, IN_Y], [G.x, IN_Y]],
  'pergunta>cache': [[TERM_X, IN_Y], [CH, IN_Y], [CH, cy(C)], [C.x, cy(C)]],
  'pergunta>llm': [[TERM_X, IN_Y], [CH, IN_Y], [CH, L.y + 36], [L.x, L.y + 36]],
  'guardrails-in>cache': [[cx(G), G.y], [cx(G), cy(C)], [C.x, cy(C)]],
  'guardrails-in>llm': [[G.x + G.w, cy(G)], [cx(C), cy(G)], [cx(C), L.y + 36], [L.x, L.y + 36]],
  'cache>llm': [[cx(C), C.y + C.h], [cx(C), L.y + 36], [L.x, L.y + 36]],
  'cache>resposta': [[C.x + 20, C.y + C.h], [C.x + 20, UNDER_DOOR], [CH, UNDER_DOOR], [CH, OUT_Y], [TERM_X, OUT_Y]],
  'llm>rag': [[cx(L), L.y + L.h], [cx(R), R.y]],
  'llm>mcp': [[L.x + L.w, L.y + 76], [cx(M), L.y + 76], [cx(M), M.y]],
  'llm>fallback': [[cx(L), L.y], [cx(F), F.y + F.h]],
  'fallback>guardrails-out': [[F.x, OUT_Y], [G.x + G.w, OUT_Y]],
  'fallback>resposta': [[F.x, F.y + 96], [C.x + 20, F.y + 96], [C.x + 20, UNDER_DOOR], [CH, UNDER_DOOR], [CH, OUT_Y], [TERM_X, OUT_Y]],
  'llm>guardrails-out': [[L.x, L.y + 76], [cx(G), L.y + 76], [cx(G), G.y + G.h]],
  'llm>resposta': [[L.x, L.y + 76], [CH, L.y + 76], [CH, OUT_Y], [TERM_X, OUT_Y]],
  'guardrails-out>resposta': [[G.x, OUT_Y], [TERM_X, OUT_Y]],
  // bastidores (ligações pontilhadas)
  'evals>llm': [[cx(E), E.y + E.h], [cx(E), L.y + 36], [L.x + L.w, L.y + 36]],
  'fine-tuning>llm': [[cx(FT), FT.y], [cx(FT), FT.y - 12], [L.x + 40, FT.y - 12], [L.x + 40, L.y + L.h]],
}

const fmt = (n: number) => String(Math.round(n * 10) / 10)

/** Linha com cantos arredondados passando pelos pontos. */
export function roundedPath(pts: Pts, radius = 14): string {
  if (pts.length < 2) return ''
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]
    const [x, y] = pts[i]
    const [nx, ny] = pts[i + 1]
    const inLen = Math.hypot(x - px, y - py)
    const outLen = Math.hypot(nx - x, ny - y)
    const r = Math.min(radius, inLen / 2, outLen / 2)
    const ax = x - ((x - px) / inLen) * r
    const ay = y - ((y - py) / inLen) * r
    const bx = x + ((nx - x) / outLen) * r
    const by = y + ((ny - y) / outLen) * r
    d += ` L${fmt(ax)} ${fmt(ay)} Q${fmt(x)} ${fmt(y)} ${fmt(bx)} ${fmt(by)}`
  }
  const last = pts[pts.length - 1]
  return `${d} L${fmt(last[0])} ${fmt(last[1])}`
}

function route(a: string, z: string): Pts {
  const direct = ROUTES[`${a}>${z}`]
  if (direct) return direct
  const reverse = ROUTES[`${z}>${a}`]
  if (reverse) return [...reverse].reverse()
  const from = nodePosition(topicOfNode(a as NodeId))
  const to = nodePosition(topicOfNode(z as NodeId))
  return [[from.x, from.y], [to.x, to.y]]
}

/** Traçado que o cartão do pedido percorre entre dois nós da simulação. */
export function pathBetween(a: NodeId, z: NodeId): string {
  return roundedPath(route(a, z))
}

const EDGE_ROUTE: Record<string, string> = {
  'pergunta>guardrails': 'pergunta>guardrails-in',
  'guardrails>cache': 'guardrails-in>cache',
  'llm>guardrails': 'llm>guardrails-out',
  'guardrails>resposta': 'guardrails-out>resposta',
}

/** Atributo `d` da ligação desenhada no mapa. */
export function edgePath(e: Edge): string {
  const key = `${e.from}>${e.to}`
  const [a, z] = (EDGE_ROUTE[key] ?? key).split('>')
  return roundedPath(route(a, z))
}
