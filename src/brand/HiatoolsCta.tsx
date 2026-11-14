import { ArrowUpRight, CalendarCheck } from 'lucide-react'
import './brand.css'
import { HIATOOLS_URL } from './brand'

const external = { href: HIATOOLS_URL, target: '_blank', rel: 'noopener' } as const

/** Assinatura discreta: "por hIAtools". */
export function HiatoolsByline() {
  return (
    <span className="hia-byline">
      por{' '}
      <a {...external} aria-label="hIAtools">
        h<b>IA</b>tools
      </a>
    </span>
  )
}

/** Botão do cabeçalho do mapa. */
export function HiatoolsButton() {
  return (
    <a {...external} className="hia-button">
      Quero um agente
      <ArrowUpRight size={16} aria-hidden="true" />
    </a>
  )
}

/** Convite no fim de cada tutorial. */
export function HiatoolsInvite() {
  return (
    <aside className="hia-invite" aria-label="Crie seu agente com a hIAtools">
      <div>
        <strong>Quer um agente assim trabalhando na sua empresa?</strong>
        <p>
          Você acabou de ver como as peças se encaixam. A hIAtools monta o agente com você, do primeiro rascunho até ele atender de verdade. Marque
          uma reunião e conte o que você precisa.
        </p>
      </div>
      <a {...external} className="hia-invite-link">
        <CalendarCheck size={18} aria-hidden="true" />
        Marcar uma reunião
      </a>
    </aside>
  )
}
