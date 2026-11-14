import { BadgeCheck, BrainCircuit, Map as MapIcon, Scale } from 'lucide-react'
import { Card, Core, SceneRoot, Show } from '../../../scene/kit'
import { OrderCard } from '../../../scene/OrderCard'
import type { SceneProps } from '../../../scene/types'

const EXEMPLOS: [string, string][] = [
  ['Tem borda recheada?', 'Tem sim! De catupiry, quer?'],
  ['Demora muito?', 'Uns quarenta minutinhos, já anoto!'],
  ['Aceita pix?', 'Aceito, na entrega ou agora.'],
]

// Passos = frases da narração:
// 0 treinar para a prova · 1 muitos exemplos no jeito da pizzaria · 2 os exemplos entram no modelo
// 3 o modelo muda: selo "treinado" (fine-tuning) · 4 responde no jeito da casa com bilhete curto
// 5 a balança: o treino custa tempo e dinheiro · 6 bilhete bom mais busca de documentos pesam mais
// 7 fim da viagem: volte ao mapa e desligue uma peça
export default function Scene({ step, stepProgress, reducedMotion }: SceneProps) {
  const balanca = step >= 5 && step <= 6
  const coreX = balanca ? 50 : 62
  const coreY = balanca ? 70 : 46
  return (
    <SceneRoot reducedMotion={reducedMotion}>
      {/* o pedido entra pela esquerda */}
      <Show on={step === 0} x={26} y={46} from="left">
        <OrderCard size="lg" text="Tem borda recheada?" shared={false} />
      </Show>

      {/* o modelo, antes e depois do treino */}
      <Show on={step <= 6} x={coreX} y={coreY} from="scale">
        <Core
          icon={<BrainCircuit />}
          name={step >= 3 ? 'Modelo treinado' : 'Modelo'}
          glow={step === 2 || step === 3}
          small={balanca}
        />
      </Show>
      <Show on={step >= 3 && step <= 4} x={77} y={34} from="scale">
        <span className="sk-helper" style={{ gridAutoFlow: 'column', gap: '0.8cqw', color: 'var(--ok)' }}>
          <span className="sk-badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
            <BadgeCheck aria-hidden />
          </span>
          selo: treinado
        </span>
      </Show>

      {/* muitos exemplos de pergunta e resposta; no passo 2 eles entram no modelo */}
      <Show on={step === 1 || step === 2} x={step === 1 ? 26 : 40} y={46} from="left">
        <div style={{ scale: step === 1 ? '1' : '0.62', transition: 'scale .6s' }}>
          <Card label="exemplos no jeito da pizzaria">
            {EXEMPLOS.map(([p, r]) => (
              <div key={p} className="sk-mono">
                <span className="sk-muted">cliente: </span>
                {p}
                <br />
                <span className="sk-muted">Pip: </span>
                {r}
              </div>
            ))}
            <span className="sk-muted">...e centenas de outros</span>
          </Card>
        </div>
      </Show>

      {/* o que é fine-tuning */}
      <Show on={step === 3} x={34} y={22} from="top">
        <Card label="fine-tuning" tone="ok">
          <span className="sk-big">continuar o treino com os seus exemplos</span>
        </Card>
      </Show>

      {/* bilhete curto, resposta no jeito da casa */}
      <Show on={step === 4} x={62} y={14} from="top">
        <Card label="bilhete de regras, bem curto">
          <span className="sk-mono">Você é o Pip.</span>
        </Card>
      </Show>
      <Show on={step === 4} x={62} y={78} from="bottom">
        <Card label="resposta no jeito da casa" tone="ok">
          <span className="sk-big">Tem sim! De catupiry, quer?</span>
        </Card>
      </Show>

      {/* a balança: treino de um lado, bilhete mais busca do outro */}
      <Show on={balanca} x={50} y={34} from="scale">
        <span style={{ display: 'inline-block', rotate: step === 5 ? '-9deg' : '9deg', transition: 'rotate .6s' }}>
          <Scale aria-hidden style={{ width: '7cqw', height: '7cqw' }} />
        </span>
      </Show>
      <Show on={balanca} x={26} y={34} from="left">
        <Card label="treinar o modelo" tone="warn">
          <span className="sk-big">tempo e dinheiro</span>
          <span className="sk-muted">e envelhece quando o cardápio muda</span>
        </Card>
      </Show>
      <Show on={step === 6} x={74} y={34} from="right">
        <Card label="bilhete bom + busca de documentos" tone="ok">
          <span className="sk-big">mais simples de mudar</span>
          <span className="sk-muted">comece por aqui</span>
        </Card>
      </Show>

      {/* fim da viagem */}
      <Show on={step >= 7} x={50} y={28} from="top">
        <Card label="fim da viagem" tone="ok">
          <span className="sk-big" style={{ display: 'flex', alignItems: 'center', gap: '1cqw' }}>
            <MapIcon aria-hidden style={{ width: '3cqw', height: '3cqw' }} /> volte ao mapa e desligue uma peça
          </span>
        </Card>
      </Show>
      <Show on={step >= 7} x={step >= 7 && stepProgress > 0.6 ? 112 : 50} y={64} from="bottom">
        <OrderCard size="lg" text="Tem sim! De catupiry, quer?" state="ok" shared={false} />
      </Show>
    </SceneRoot>
  )
}
