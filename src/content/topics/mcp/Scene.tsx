import { BrainCircuit, ChefHat, Plug, Wrench, X } from 'lucide-react'
import { Card, Chips, Core, SceneRoot, Show, Wire } from '../../../scene/kit'
import { OrderCard } from '../../../scene/OrderCard'
import type { SceneProps } from '../../../scene/types'

const APARELHOS = ['lâmpada', 'ventilador', 'celular']

// Passos = frases da narração:
// 0 tomada padrão: aparelhos encaixam no mesmo plugue (o pedido entra) · 1 o cliente pede; o modelo só fala
// 2 falou mas não anotou nada · 3 existe uma ferramenta: anotar_pedido · 4 o MCP é o plugue que liga as duas pontas
// 5 o modelo pede anotar_pedido e o plugue liga na cozinha · 6 volta "pedido nº 127" · 7 o Pip confirma; o pedido sai pela direita
export default function Scene({ step, stepProgress, reducedMotion }: SceneProps) {
  return (
    <SceneRoot reducedMotion={reducedMotion}>
      <Wire from={[30, 56]} to={[56, 56]} on={step >= 4} />
      <Wire from={[56, 56]} to={[80, 38]} on={step >= 4} />
      <Wire from={[56, 56]} to={[80, 74]} on={step >= 5} />

      {/* o pedido do cliente */}
      <Show on={step <= 6} x={18} y={28} from="left">
        <OrderCard size="lg" text="Uma calabresa grande para entregar, por favor." shared={false} />
      </Show>

      {/* passo 0: a tomada e os aparelhos */}
      <Show on={step === 0} x={62} y={44} from="scale">
        <Core icon={<Plug />} name="Tomada padrão" />
      </Show>
      <Show on={step === 0} x={62} y={70} from="bottom">
        <Chips items={APARELHOS} count={APARELHOS.length} tone="out" />
      </Show>

      {/* o modelo */}
      <Show on={step >= 1} x={30} y={56} from="scale">
        <Core icon={<BrainCircuit />} name="Pip (modelo)" glow={step === 5} small />
      </Show>

      {/* passos 1-2: ele só fala */}
      <Show on={step === 1 || step === 2} x={52} y={22} from="top">
        <Card label="o Pip diz" tone="paper">
          <span className="sk-big">Vou anotar seu pedido!</span>
        </Card>
      </Show>
      <Show on={step === 2} x={80} y={56} from="right">
        <Card label="na cozinha" tone="bad">
          <span className="sk-big">nada anotado</span>
          <span className="sk-muted">
            <X size={14} style={{ verticalAlign: '-2px' }} /> a cozinha não ficou sabendo
          </span>
        </Card>
      </Show>

      {/* passos 3-7: a ferramenta */}
      <Show on={step >= 3} x={80} y={38} from="right">
        <Card label="ferramenta">
          <span className="sk-mono">
            <Wrench size={14} style={{ verticalAlign: '-2px' }} /> anotar_pedido
          </span>
        </Card>
      </Show>

      {/* passo 4 em diante: o plugue MCP */}
      <Show on={step >= 4} x={56} y={56} from="scale">
        <Core icon={<Plug />} name="MCP" glow={step === 5 || step === 6} small />
      </Show>

      {/* passo 5: o pedido de ferramenta; a cozinha */}
      <Show on={step === 5} x={52} y={22} from="top">
        <Card label="o modelo pede" tone="warn">
          <span className="sk-mono">anotar_pedido(calabresa grande, entrega)</span>
        </Card>
      </Show>
      <Show on={step >= 5} x={80} y={74} from="right">
        <Card label="cozinha" tone="paper">
          <span className="sk-big">
            <ChefHat size={20} style={{ verticalAlign: '-3px' }} /> {step >= 6 ? 'anotado' : 'anotando'}
          </span>
        </Card>
      </Show>

      {/* passos 6-7: o resultado */}
      <Show on={step >= 6} x={52} y={22} from="top">
        <Card label="resultado" tone="ok">
          <span className="sk-big">pedido nº 127</span>
          <span className="sk-muted">{step >= 7 ? 'Pip confirma ao cliente' : 'a cozinha devolveu'}</span>
        </Card>
      </Show>

      {/* o pedido segue viagem */}
      <Show on={step >= 7} x={step >= 7 && stepProgress > 0.6 ? 112 : 50} y={82} from="bottom">
        <div style={{ scale: '0.62' }}>
          <OrderCard size="lg" text="Anotado! Seu pedido é o nº 127." state="ok" shared={false} />
        </div>
      </Show>
    </SceneRoot>
  )
}
