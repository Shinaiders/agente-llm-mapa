import { BookOpen, BrainCircuit, Check, Plug, Search, X } from 'lucide-react'
import { Card, Core, SceneRoot, Show, Wire } from '../../../scene/kit'
import { OrderCard } from '../../../scene/OrderCard'
import type { SceneProps } from '../../../scene/types'

const PEDACOS = [
  'Margherita grande: R$ 49,00',
  'Quatro queijos grande: R$ 58,00',
  'Quatro queijos broto: R$ 36,00',
  'Borda recheada: + R$ 8,00',
  'Entrega: grátis acima de R$ 60,00',
]
// quais pedaços a busca trouxe (índices de PEDACOS)
const ACHADOS = [1, 2]

// Passos = frases da narração:
// 0 prova com consulta (o pedido entra, livro aberto) · 1 a pergunta chega ao modelo
// 2 sem consulta: preço chutado, riscado · 3 a pergunta vira uma busca
// 4 o cardápio em pedaços; os mais parecidos são marcados · 5 trechos + pergunta viram o prompt
// 6 resposta certa: R$ 58,00 · 7 mostra a fonte; o pedido sai pela direita
export default function Scene({ step, stepProgress, reducedMotion }: SceneProps) {
  return (
    <SceneRoot reducedMotion={reducedMotion}>
      <Wire from={[22, 30]} to={[50, 44]} on={step >= 1 && step <= 6} />
      <Wire from={[50, 44]} to={[50, 18]} on={step >= 3 && step <= 4} />
      <Wire from={[50, 44]} to={[80, 52]} on={step === 4} />
      <Wire from={[50, 44]} to={[50, 74]} on={step === 5} />
      <Wire from={[50, 44]} to={[80, 34]} on={step === 6 || step === 7} />

      {/* o pedido do cliente */}
      <Show on={step <= 6} x={18} y={30} from="left">
        <OrderCard size="lg" text="Quanto custa a quatro queijos grande?" shared={false} />
      </Show>

      {/* passo 0: prova com consulta */}
      <Show on={step === 0} x={62} y={44} from="scale">
        <Core icon={<BookOpen />} name="Prova com consulta" />
      </Show>

      {/* o modelo */}
      <Show on={step >= 1} x={50} y={44} from="scale">
        <Core icon={<BrainCircuit />} name="Pip (modelo)" glow={step === 2 || step === 6} />
      </Show>

      {/* passo 2: o chute */}
      <Show on={step === 2} x={80} y={32} from="right">
        <Card label="sem consultar" tone="bad">
          <span className="sk-big" style={{ textDecoration: 'line-through' }}>
            R$ 38,00
          </span>
          <span className="sk-muted">
            <X size={14} style={{ verticalAlign: '-2px' }} /> preço inventado
          </span>
        </Card>
      </Show>

      {/* passos 3-4: a busca */}
      <Show on={step >= 3 && step <= 4} x={50} y={16} from="top">
        <Card label="busca">
          <span className="sk-mono">
            <Search size={14} style={{ verticalAlign: '-2px' }} /> quatro queijos grande preço
          </span>
        </Card>
      </Show>

      {/* passo 4: o cardápio em pedaços */}
      <Show on={step === 4} x={80} y={54} from="right">
        <Card label="cardápio em pedaços">
          {PEDACOS.map((p, i) => {
            const achado = ACHADOS.includes(i)
            return (
              <span key={p} className="sk-mono" style={{ opacity: achado ? 1 : 0.4 }}>
                {achado ? <Check size={14} style={{ verticalAlign: '-2px' }} /> : '· '}
                {achado ? ' ' : ''}
                {p}
              </span>
            )
          })}
          <span className="sk-muted">✓ = mais parecido com a pergunta</span>
        </Card>
      </Show>

      {/* passos 5-6: o que o modelo recebe */}
      <Show on={step >= 5 && step <= 6} x={50} y={74} from="bottom">
        <Card label="o que o modelo recebe" tone="paper">
          <span className="sk-mono">Trecho 1: {PEDACOS[1]}</span>
          <span className="sk-mono">Trecho 2: {PEDACOS[2]}</span>
          <span className="sk-mono">Pergunta: quanto custa a quatro queijos grande?</span>
        </Card>
      </Show>

      {/* passos 6-7: a resposta certa e a fonte */}
      <Show on={step >= 6} x={80} y={34} from="right">
        <Card label="resposta" tone="ok">
          <span className="sk-big">R$ 58,00</span>
          <span className="sk-muted">{step >= 7 ? 'fonte: cardápio, trecho 1' : 'quatro queijos grande'}</span>
        </Card>
      </Show>

      {/* passo 7: a próxima peça */}
      <Show on={step >= 7} x={80} y={66} from="scale" delay={0.15}>
        <div className="sk-helper">
          <span className="sk-badge">
            <Plug />
          </span>
          Próxima: MCP
        </div>
      </Show>

      {/* o pedido segue viagem */}
      <Show on={step >= 7} x={step >= 7 && stepProgress > 0.6 ? 112 : 38} y={78} from="bottom">
        <div style={{ scale: '0.62' }}>
          <OrderCard size="lg" text="A quatro queijos grande custa R$ 58,00." state="ok" shared={false} />
        </div>
      </Show>
    </SceneRoot>
  )
}
