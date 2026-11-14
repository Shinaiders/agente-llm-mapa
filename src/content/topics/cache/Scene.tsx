import { BrainCircuit, NotebookPen } from 'lucide-react'
import { Card, Core, SceneRoot, Show, Wire } from '../../../scene/kit'
import { OrderCard } from '../../../scene/OrderCard'
import type { SceneProps } from '../../../scene/types'

const PERGUNTA = 'Até que horas vocês abrem?'
const RESPOSTA = 'Abrimos todo dia até as 23h!'

// Passos = frases da narração:
// 0 conta de ontem, não refazer · 1 anotar no caderno · 2 o caderno é o cache (vazio)
// 3 primeira pergunta: caderno vazio, vai ao modelo · 4 resposta anotada no caderno
// 5 a mesma pergunta volta e o caderno acha · 6 sai direto, rápida e sem custo · 7 o que não guardar; o pedido segue
export default function Scene({ step, stepProgress, reducedMotion }: SceneProps) {
  const x = step <= 2 || step === 5 ? 18 : step >= 7 && stepProgress > 0.6 ? 112 : 68
  const text = step === 4 || step === 6 || step === 7 ? RESPOSTA : PERGUNTA
  const anotado = step >= 4
  return (
    <SceneRoot reducedMotion={reducedMotion}>
      <Wire from={[50, 44]} to={[86, 44]} on={step === 3 || step === 4} />

      {/* o caderno */}
      <Show on={step >= 1} x={50} y={44} from="scale">
        <Core icon={<NotebookPen />} name={step >= 2 ? 'Cache' : 'Caderno'} glow={step === 1 || step === 4 || step === 5} />
      </Show>

      {/* o modelo, do outro lado */}
      <Show on={step >= 3} x={86} y={44} from="right">
        <div style={{ opacity: step === 5 || step === 6 ? 0.35 : 1, transition: 'opacity .6s' }}>
          <Core icon={<BrainCircuit />} name="Modelo" small />
        </div>
      </Show>

      {/* a conta de ontem */}
      <Show on={step <= 1} x={50} y={step === 0 ? 30 : 16} from="top">
        <Card label="conta de ontem" tone="paper">
          <span className="sk-big">12 × 7 = 84</span>
          <span className="sk-muted">{step === 0 ? 'já resolvi essa' : 'anotada no caderno'}</span>
        </Card>
      </Show>

      {/* a pergunta e a resposta */}
      <Show on={step >= 0} x={x} y={44} from="left">
        <div style={{ scale: '0.75' }}>
          <OrderCard size="lg" text={text} state={step >= 6 ? 'ok' : 'idle'} shared={false} />
        </div>
      </Show>

      {/* o que o caderno diz */}
      <Show on={step >= 3 && step <= 5} x={30} y={16} from="top">
        <Card label="consulta ao caderno" tone={step === 3 ? 'warn' : step === 5 ? 'ok' : undefined}>
          <span className="sk-big">
            {step === 3 && 'Não achei: vai até o modelo'}
            {step === 4 && 'Resposta anotada no caderno'}
            {step === 5 && 'Achei! Não precisa do modelo'}
          </span>
        </Card>
      </Show>

      {/* as páginas do caderno */}
      <Show on={step >= 2} x={50} y={77} from="bottom">
        <Card label="caderno de respostas" tone={step === 5 || step === 6 ? 'ok' : undefined}>
          {anotado ? (
            <span className="sk-mono">
              {'até que horas vocês abrem?\n→ ' + RESPOSTA}
            </span>
          ) : (
            <span className="sk-muted">ainda vazio</span>
          )}
        </Card>
      </Show>

      {/* o ganho */}
      <Show on={step === 6} x={72} y={16} from="top">
        <Card label="desta vez" tone="ok">
          <span className="sk-big">mais rápido, sem custo</span>
        </Card>
      </Show>

      {/* o que não vai para o caderno */}
      <Show on={step >= 7} x={50} y={14} from="top">
        <Card label="não guardar" tone="warn">
          <span className="sk-big">pergunta pessoal ou que muda</span>
          <span className="sk-muted">ex.: meu pedido já saiu?</span>
        </Card>
      </Show>
    </SceneRoot>
  )
}
