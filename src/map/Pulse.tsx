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
