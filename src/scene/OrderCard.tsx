import { motion } from 'motion/react'
import './order-card.css'

export interface OrderCardProps {
  size: 'sm' | 'lg'
  text?: string
  state?: 'idle' | 'ok' | 'blocked' | 'error'
  /** false desliga a animação compartilhada (útil quando há mais de um cartão na tela) */
  shared?: boolean
}

/** O pedido do cliente: o personagem que atravessa o mapa e todas as cenas. */
export function OrderCard({ size, text, state = 'idle', shared = true }: OrderCardProps) {
  return (
    <motion.div className={`order-card order-card-${size}`} data-state={state} layoutId={shared ? 'order-card' : undefined} aria-hidden={size === 'sm' || undefined}>
      <span className="order-card-tab" />
      {size === 'lg' ? (
        <>
          <span className="order-card-label">Pedido</span>
          <span className="order-card-text">{text}</span>
        </>
      ) : (
        <>
          <span className="order-card-line" />
          <span className="order-card-line" />
        </>
      )}
    </motion.div>
  )
}
