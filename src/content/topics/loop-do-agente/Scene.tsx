import { BrainCircuit, CheckCircle2, RefreshCw, Wrench } from 'lucide-react'
import { Card, Core, SceneRoot, Show, Wire } from '../../../scene/kit'
import type { SceneProps } from '../../../scene/types'

export default function Scene({ step, reducedMotion }: SceneProps) {
  const isLoop = step >= 1
  const callingTool = step >= 3
  const receivingTool = step >= 4
  const secondCycle = step >= 5
  const isDone = step >= 6

  return (
    <SceneRoot reducedMotion={reducedMotion}>
      <Wire from={[50, 42]} to={[25, 42]} on={isLoop} />
      <Wire from={[50, 42]} to={[75, 42]} on={callingTool} />
      <Wire from={[75, 42]} to={[50, 68]} on={receivingTool} />
      <Wire from={[50, 68]} to={[25, 42]} on={secondCycle} />

      {/* Cérebro / Raciocínio */}
      <Show on x={50} y={42} from="scale">
        <Core
          icon={<BrainCircuit />}
          name="1. Pensar (LLM)"
          glow={step === 2 || step === 5 || isDone}
        />
      </Show>

      {/* Caixa do Objetivo */}
      <Show on={isLoop} x={25} y={42} from="left">
        <Card label="objetivo">
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>Pedir pizza</span>
            <span style={{ color: 'var(--text-muted)' }}>"Quero uma 4 queijos"</span>
          </div>
        </Card>
      </Show>

      {/* Chamada da Ferramenta */}
      <Show on={callingTool} x={75} y={42} from="right">
        <Card label="2. Agir (Tool)">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#f2c14e' }}>
            <Wrench size={14} />
            <span>consultar_preco()</span>
          </div>
        </Card>
      </Show>

      {/* Observação / Retorno */}
      <Show on={receivingTool && !isDone} x={50} y={68} from="bottom">
        <Card label="3. Observar">
          <div style={{ fontSize: '11px', color: '#7fca84' }}>
            <span>Preço: R$ 58,00</span>
          </div>
        </Card>
      </Show>

      {/* Resposta final concluída */}
      <Show on={isDone} x={50} y={68} from="bottom">
        <Card label="resposta final">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7fca84', fontSize: '11px' }}>
            <CheckCircle2 size={16} />
            <span>A 4 queijos custa R$ 58,00!</span>
          </div>
        </Card>
      </Show>

      {/* Indicadores textuais */}
      <Show on={step === 0} x={50} y={65} from="none">
        <span className="sk-muted">Tarefas complexas exigem múltiplos passos sucessivos</span>
      </Show>
      <Show on={secondCycle && !isDone} x={50} y={20} from="top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#63b8de' }}>
          <RefreshCw size={14} />
          <span>Iterando no loop até o stop_reason não ser mais tool_use</span>
        </div>
      </Show>
    </SceneRoot>
  )
}
