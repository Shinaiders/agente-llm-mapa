import { motion } from 'motion/react'
import { OrderCard } from '../scene/OrderCard'
import type { Hop } from '../sim/types'
import { nodePosition, pathBetween, topicOfNode } from './layout'

interface Props {
  hops: Hop[]
  hopIndex: number
  /** duração da viagem entre dois nós, em ms */
  travelMs: number
  reducedMotion: boolean
}

const STATE = { ok: 'ok', blocked: 'blocked', error: 'error', skipped: 'idle' } as const

/** O cartão do pedido andando pelo mapa, de um salto para o outro. */
export function Pulse({ hops, hopIndex, travelMs, reducedMotion }: Props) {
  const hop = hops[hopIndex]
  if (!hop) return null
  const prev = hopIndex > 0 ? hops[hopIndex - 1] : null
  const here = nodePosition(topicOfNode(hop.node))
  const state = hopIndex === 0 ? 'idle' : STATE[hop.status]

  if (!prev || reducedMotion) {
    return (
      <div className="pulse" style={{ left: here.x, top: here.y - 34 }} data-testid="pulse">
        <OrderCard size="sm" state={state} shared={false} />
      </div>
    )
  }

  const d = pathBetween(prev.node, hop.node)
  return (
    <motion.div
      key={`${prev.node}>${hop.node}:${hopIndex}`}
      className="pulse pulse-travel"
      data-testid="pulse"
      style={{ offsetPath: `path("${d}")`, offsetRotate: '0deg' }}
      initial={{ offsetDistance: '0%' }}
      animate={{ offsetDistance: '100%' }}
      transition={{ duration: travelMs / 1000, ease: [0.5, 0, 0.2, 1] }}
    >
      <OrderCard size="sm" state={state} shared={false} />
    </motion.div>
  )
}

/** O cartão correndo de um assunto ao outro durante a viagem. */
export function TransitPulse({ from, to, ms, reducedMotion }: { from: string; to: string; ms: number; reducedMotion: boolean }) {
  const asNode = (id: string) => (id === 'guardrails' ? 'guardrails-in' : id) as Hop['node']
  const here = nodePosition(to)
  if (reducedMotion) {
    return (
      <div className="pulse" style={{ left: here.x, top: here.y - 34 }} data-testid="transit" data-to={to}>
        <OrderCard size="sm" shared={false} />
      </div>
    )
  }
  return (
    <motion.div
      key={`${from}>${to}`}
      className="pulse pulse-travel pulse-transit"
      data-testid="transit"
      data-to={to}
      style={{ offsetPath: `path("${pathBetween(asNode(from), asNode(to))}")`, offsetRotate: '0deg' }}
      initial={{ offsetDistance: '0%', scale: 2.2 }}
      animate={{ offsetDistance: '100%', scale: [2.2, 1.2, 1.2, 2.2] }}
      transition={{ duration: ms / 1000, ease: [0.6, 0, 0.3, 1] }}
    >
      <OrderCard size="sm" shared={false} />
    </motion.div>
  )
}
