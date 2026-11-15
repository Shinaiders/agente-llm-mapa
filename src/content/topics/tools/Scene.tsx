import { BrainCircuit, CheckCircle2 } from 'lucide-react'
import { Card, Core, SceneRoot, Show, Wire } from '../../../scene/kit'
import type { SceneProps } from '../../../scene/types'

export default function Scene({ step, reducedMotion }: SceneProps) {
  const showTools = step >= 1
  const showCall = step >= 4
  const showResult = step >= 5
  const isComplete = step >= 6

  return (
    <SceneRoot reducedMotion={reducedMotion}>
      <Wire from={[50, 40]} to={[24, 40]} on={showTools} />
      <Wire from={[50, 40]} to={[76, 40]} on={showCall} />

      {/* Cérebro / LLM */}
      <Show on x={50} y={40} from="scale">
        <Core
          icon={<BrainCircuit />}
          name="Modelo (LLM)"
          glow={step === 0 || step === 4 || isComplete}
        />
      </Show>

      {/* Caixa de Ferramentas */}
      <Show on={showTools} x={24} y={40} from="left">
        <Card label="tools disponíveis">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
            <span style={{ color: step >= 3 ? '#7fca84' : 'inherit', fontWeight: step >= 3 ? 600 : 400 }}>
              🔧 consultar_cardapio()
            </span>
            <span style={{ color: step >= 4 ? '#f2c14e' : 'inherit', fontWeight: step >= 4 ? 600 : 400 }}>
              🍕 criar_pedido()
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              🚚 calcular_frete()
            </span>
          </div>
        </Card>
      </Show>

      {/* JSON emitido pelo modelo */}
      <Show on={showCall && !showResult} x={76} y={35} from="right">
        <Card label="chamada tool_use (JSON)">
          <pre style={{ margin: 0, fontSize: '10px', color: '#f2c14e' }}>
            {`{\n  "name": "criar_pedido",\n  "args": { "sabor": "calabresa" }\n}`}
          </pre>
        </Card>
      </Show>

      {/* Execução do sistema e retorno */}
      <Show on={showResult} x={76} y={40} from="right">
        <Card label="resposta do sistema">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7fca84', fontSize: '11px' }}>
            <CheckCircle2 size={16} />
            <span>Pedido #127 registrado!</span>
          </div>
        </Card>
      </Show>

      {/* Status do passo */}
      <Show on={step === 0} x={50} y={64} from="none">
        <span className="sk-muted">O modelo só conversa: não tem como alterar o sistema</span>
      </Show>
      <Show on={step === 2} x={50} y={64} from="none">
        <span className="sk-muted">Você descreve os nomes e parâmetros de cada função</span>
      </Show>
      <Show on={isComplete} x={50} y={64} from="none">
        <span className="sk-muted" style={{ color: '#7fca84' }}>Agora o modelo pensa E age no mundo real</span>
      </Show>
    </SceneRoot>
  )
}
