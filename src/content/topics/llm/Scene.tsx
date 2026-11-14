import { BookOpen, Boxes, BrainCircuit, DoorOpen, Plug } from 'lucide-react'
import { Card, Chips, Core, SceneRoot, Show, Wire, reveal } from '../../../scene/kit'
import { OrderCard } from '../../../scene/OrderCard'
import type { SceneProps } from '../../../scene/types'

const BOOKS = ['#ff7a59', '#f2c14e', '#7fca84', '#63b8de', '#ea6a88', '#b9a0f2', '#f2c14e', '#ff7a59', '#63b8de', '#7fca84']
const IN = ['Até', ' que', ' horas', ' vocês', ' ficam', ' abertos', '?']
const OUT = ['Hoje', ' a', ' gente', ' fica', ' aberto', ' até', ' as', ' 23h', '!']
const GUESS: [string, number][] = [
  ['vez', 86],
  ['noite', 9],
  ['pizza', 2],
]

// Passos = frases da narração:
// 0 biblioteca · 1 adivinhar a próxima palavra · 2 "modelo de linguagem" · 3 tokens
// 4 resposta pedacinho a pedacinho · 5 bilhete de regras · 6 não conhece o cardápio · 7 as outras peças
export default function Scene({ step, stepProgress, reducedMotion }: SceneProps) {
  const coreX = step >= 3 ? 50 : step === 2 ? 50 : 58
  const helpers = step >= 7
  return (
    <SceneRoot reducedMotion={reducedMotion}>
      <Wire from={[50, 44]} to={[20, 20]} on={helpers} />
      <Wire from={[50, 44]} to={[80, 20]} on={helpers} />
      <Wire from={[50, 44]} to={[16, 62]} on={helpers} />
      <Wire from={[50, 44]} to={[84, 62]} on={helpers} />

      {/* a biblioteca que o modelo leu */}
      <Show on={step <= 1} x={step === 0 ? 24 : 52} y={44} from="left">
        <div className="sk-books" style={{ opacity: step === 1 ? 0.25 : 1, transition: 'opacity .6s' }}>
          {BOOKS.map((c, i) => (
            <span key={i} className="sk-book" style={{ background: c, height: `${5 + ((i * 7) % 4)}cqw` }} />
          ))}
        </div>
      </Show>
      <Show on={step === 0} x={24} y={60} from="none">
        <span className="sk-muted">milhões de livros</span>
      </Show>

      {/* o cérebro */}
      <Show on x={coreX} y={step >= 3 ? 44 : 42} from="scale">
        <Core icon={<BrainCircuit />} name={step >= 2 ? 'Modelo de linguagem (LLM)' : undefined} glow={step === 1 || step === 4} />
      </Show>

      {/* adivinhar a próxima palavra */}
      <Show on={step === 1} x={26} y={42} from="left">
        <Card label="qual palavra vem depois?">
          <span className="sk-big">Era uma ___</span>
          <div className="sk-bars">
            {GUESS.map(([w, p]) => (
              <div key={w}>
                <span>{w}</span>
                <i style={{ width: `${p}%`, opacity: 0.35 + p / 130 }} />
                <span className="sk-muted">{p}%</span>
              </div>
            ))}
          </div>
        </Card>
      </Show>

      {/* o pedido chega e vira tokens */}
      <Show on={step <= 6} x={step <= 2 ? 12 : 19} y={step <= 2 ? 82 : 36} from="left">
        <div style={{ scale: step <= 2 ? '0.62' : '1', transition: 'scale .6s' }}>
          <OrderCard size="lg" text="Até que horas vocês ficam abertos?" shared={false} />
        </div>
      </Show>
      <Show on={step >= 3 && step <= 6} x={19} y={58} from="top">
        <Chips items={IN} count={reveal(step, 3, stepProgress, IN.length)} />
      </Show>

      {/* a resposta sai um token de cada vez */}
      <Show on={step >= 4 && step <= 5} x={81} y={44} from="none">
        <Chips items={OUT} count={reveal(step, 4, stepProgress, OUT.length)} tone="out" />
      </Show>

      {/* o bilhete com as regras */}
      <Show on={step === 5} x={50} y={14} from="top">
        <Card label="system prompt · o bilhete">
          <span className="sk-mono">Você é o Pip, atendente da pizzaria.</span>
        </Card>
      </Show>

      {/* o que ele não sabe */}
      <Show on={step === 6} x={80} y={40} from="right">
        <Card label="cardápio de hoje" tone="bad">
          <span className="sk-big">? ? ?</span>
          <span className="sk-muted">ele nunca leu isso</span>
        </Card>
      </Show>

      {/* as outras peças */}
      <Show on={helpers} x={20} y={20} from="scale" delay={0.05}>
        <Helper icon={<DoorOpen />} name="Guardrails" />
      </Show>
      <Show on={helpers} x={80} y={20} from="scale" delay={0.15}>
        <Helper icon={<Boxes />} name="Cache" />
      </Show>
      <Show on={helpers} x={16} y={62} from="scale" delay={0.25}>
        <Helper icon={<BookOpen />} name="RAG" />
      </Show>
      <Show on={helpers} x={84} y={62} from="scale" delay={0.35}>
        <Helper icon={<Plug />} name="MCP" />
      </Show>

      {/* o pedido segue viagem */}
      <Show on={step >= 7} x={step >= 7 && stepProgress > 0.6 ? 112 : 50} y={80} from="bottom">
        <div style={{ scale: '0.62' }}>
          <OrderCard size="lg" text="Hoje a gente fica aberto até as 23h!" state="ok" shared={false} />
        </div>
      </Show>
    </SceneRoot>
  )
}

function Helper({ icon, name }: { icon: React.ReactNode; name: string }) {
  return (
    <div className="sk-helper">
      <span className="sk-badge">{icon}</span>
      {name}
    </div>
  )
}
