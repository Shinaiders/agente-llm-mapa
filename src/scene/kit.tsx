/**
 * Peças para montar cenas. Todas são função pura das props: a cena diz, a cada passo,
 * onde cada coisa está e se aparece; o Motion cuida de ir de um estado ao outro.
 * Posições em % do palco; tamanhos em cqw para a cena escalar junto com o palco.
 */
import { motion } from 'motion/react'
import { type CSSProperties, type ReactNode, createContext, useContext } from 'react'
import './kit.css'

const Reduced = createContext(false)
const EASE = [0.22, 1, 0.36, 1] as const

export function SceneRoot({ reducedMotion, children }: { reducedMotion: boolean; children: ReactNode }) {
  return (
    <Reduced.Provider value={reducedMotion}>
      <div className="sk-root">{children}</div>
    </Reduced.Provider>
  )
}

type From = 'left' | 'right' | 'top' | 'bottom' | 'scale' | 'none'
const OFFSET: Record<From, { x?: string; y?: string; scale?: number }> = {
  left: { x: '-6cqw' },
  right: { x: '6cqw' },
  top: { y: '-5cqw' },
  bottom: { y: '5cqw' },
  scale: { scale: 0.6 },
  none: {},
}

interface ShowProps {
  on: boolean
  /** de onde entra (e para onde sai) */
  from?: From
  /** posição do centro, em % do palco */
  x?: number
  y?: number
  delay?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** Aparece quando `on` é true. Se receber x/y, fica centrado nesse ponto e desliza até ele quando muda. */
export function Show({ on, from = 'bottom', x, y, delay = 0, className, style, children }: ShowProps) {
  const reduced = useContext(Reduced)
  const off = reduced ? {} : OFFSET[from]
  const positioned = x !== undefined && y !== undefined
  return (
    <motion.div
      className={`${positioned ? 'sk-at ' : ''}${className ?? ''}`}
      style={style}
      initial={false}
      animate={{
        opacity: on ? 1 : 0,
        x: on ? '0cqw' : (off.x ?? '0cqw'),
        y: on ? '0cqw' : (off.y ?? '0cqw'),
        scale: on ? 1 : (off.scale ?? 1),
        ...(positioned ? { left: `${x}%`, top: `${y}%` } : {}),
      }}
      transition={reduced ? { duration: 0.2 } : { duration: 0.6, ease: EASE, delay: on ? delay : 0 }}
      aria-hidden={!on}
    >
      {children}
    </motion.div>
  )
}

/** Fileira de fichas que aparecem uma a uma: mostra as `count` primeiras. */
export function Chips({ items, count, tone }: { items: string[]; count: number; tone?: 'in' | 'out' | 'bad' }) {
  const reduced = useContext(Reduced)
  return (
    <div className="sk-chips" data-tone={tone}>
      {items.map((t, i) => (
        <motion.span
          key={i}
          className="sk-chip"
          initial={false}
          animate={{ opacity: i < count ? 1 : 0, y: i < count || reduced ? '0cqw' : '1.2cqw' }}
          transition={{ duration: reduced ? 0.15 : 0.3, ease: EASE }}
        >
          {t}
        </motion.span>
      ))}
    </div>
  )
}

/** Quantos itens de `total` já apareceram, dado o passo atual e o progresso dentro dele. */
export function reveal(step: number, at: number, progress: number, total: number): number {
  if (step < at) return 0
  if (step > at) return total
  return Math.min(total, Math.ceil(progress * 1.25 * total))
}

/** Linha entre dois pontos do palco (em %), que "acende" quando `on`. */
export function Wire({ from, to, on, dashed }: { from: [number, number]; to: [number, number]; on: boolean; dashed?: boolean }) {
  const reduced = useContext(Reduced)
  return (
    <svg className="sk-wire" viewBox="0 0 100 56.25" preserveAspectRatio="none" aria-hidden="true">
      <motion.line
        x1={from[0]}
        y1={(from[1] * 56.25) / 100}
        x2={to[0]}
        y2={(to[1] * 56.25) / 100}
        strokeDasharray={dashed ? '0.6 1.2' : undefined}
        initial={false}
        animate={{ pathLength: on || dashed ? 1 : 0, opacity: on ? 1 : 0 }}
        transition={{ duration: reduced ? 0.15 : 0.6, ease: EASE }}
      />
    </svg>
  )
}

/** Cartão genérico da cena (papel escuro), com rótulo opcional em cima. */
export function Card({ label, tone, children, className }: { label?: string; tone?: 'ok' | 'bad' | 'warn' | 'paper'; children?: ReactNode; className?: string }) {
  return (
    <div className={`sk-card ${className ?? ''}`} data-tone={tone}>
      {label && <span className="sk-card-label">{label}</span>}
      {children}
    </div>
  )
}

/** O "cérebro"/peça central de uma cena: um disco com ícone e nome. */
export function Core({ icon, name, glow, small }: { icon: ReactNode; name?: string; glow?: boolean; small?: boolean }) {
  return (
    <div className="sk-core" data-glow={glow || undefined} data-small={small || undefined}>
      <div className="sk-core-disc">{icon}</div>
      {name && <span className="sk-core-name">{name}</span>}
    </div>
  )
}
