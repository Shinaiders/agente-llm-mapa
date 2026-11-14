import { BrainCircuit, Check, Clock, RotateCw, Shuffle, TriangleAlert, X } from 'lucide-react'
import { Card, Core, SceneRoot, Show, Wire } from '../../../scene/kit'
import { OrderCard } from '../../../scene/OrderCard'
import type { SceneProps } from '../../../scene/types'

const PEDIDO = 'Quero uma pizza de calabresa, por favor.'
const RESPOSTA = 'Sua pizza sai em trinta minutos!'
const EMERGENCIA = 'Estamos com um probleminha. Tente de novo em instantes ou ligue para a loja.'

// Passos = frases da narração:
// 0 o forno principal quebra (a falha) · 1 vale tentar de novo · 2 espera um pouquinho
// 3 tenta outra vez e falha de novo · 4 troca para o modelo reserva · 5 o reserva responde
// 6 tudo falhou: resposta de emergência · 7 fallback e retry; o pedido segue
export default function Scene({ step, stepProgress, reducedMotion }: SceneProps) {
  const noReserva = step === 5 || step === 7
  const x = step <= 4 ? 16 : step >= 7 && stepProgress > 0.6 ? 112 : 80
  const y = step <= 4 ? 50 : 60
  const text = step === 6 ? EMERGENCIA : step === 5 || step === 7 ? RESPOSTA : PEDIDO
  const state = noReserva ? 'ok' : step === 6 ? 'blocked' : 'idle'
  return (
    <SceneRoot reducedMotion={reducedMotion}>
      <Wire from={[48, 34]} to={[80, 34]} on={step >= 4} dashed />

      {/* o modelo principal */}
      <Show on x={48} y={34} from="scale">
        <div style={{ opacity: step >= 4 ? 0.4 : 1, transition: 'opacity .6s' }}>
          <Core icon={<BrainCircuit />} name="Modelo principal" glow={step === 2 || step === 3} />
        </div>
      </Show>

      {/* o modelo reserva */}
      <Show on={step >= 4} x={80} y={34} from="right">
        <Core icon={<BrainCircuit />} name="Modelo reserva" small glow={step === 4 || step === 5} />
      </Show>

      {/* o cartão: pedido, depois resposta */}
      <Show on x={x} y={y} from="left">
        <div style={{ scale: '0.75' }}>
          <OrderCard size="lg" text={text} state={state} shared={false} />
        </div>
      </Show>

      {/* o que está acontecendo com as tentativas */}
      <Show on={step <= 6} x={48} y={76} from="bottom">
        <Card
          label={['forno principal', 'tentar de novo', 'espera', 'segunda tentativa', 'plano B', 'modelo reserva', 'último recurso'][Math.min(step, 6)]}
          tone={step === 0 || step === 3 || step === 6 ? 'bad' : step === 5 ? 'ok' : step === 4 ? 'warn' : undefined}
        >
          {step === 0 && <Status icon={<X />} text="Principal falhou" />}
          {step === 1 && <Status icon={<RotateCw />} text="Vale tentar de novo" />}
          {step === 2 && <Status icon={<Clock />} text="Esperando um pouquinho..." />}
          {step === 3 && <Status icon={<X />} text="Falhou outra vez" />}
          {step === 4 && <Status icon={<Shuffle />} text="Trocando para o reserva" />}
          {step === 5 && <Status icon={<Check />} text="Reserva respondeu" />}
          {step === 6 && <Status icon={<TriangleAlert />} text="Tudo falhou: resposta de emergência" />}
        </Card>
      </Show>

      {/* o resumo */}
      <Show on={step >= 7} x={50} y={14} from="top">
        <Card label="fallback e retry" tone="ok">
          <span className="sk-big">tenta de novo, troca de modelo, avisa com educação</span>
        </Card>
      </Show>
    </SceneRoot>
  )
}

function Status({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="sk-big" style={{ display: 'flex', alignItems: 'center', gap: '0.8cqw' }}>
      <span style={{ display: 'inline-flex', width: '2.4cqw', height: '2.4cqw' }}>{icon}</span>
      {text}
    </span>
  )
}
