import { BookMarked, BrainCircuit, MessageSquare, Sparkles, User } from 'lucide-react'
import { Card, Core, SceneRoot, Show, Wire } from '../../../scene/kit'
import type { SceneProps } from '../../../scene/types'

export default function Scene({ step, reducedMotion }: SceneProps) {
  const showBook = step >= 1
  const showShortTerm = step >= 2
  const showPreferences = step >= 4
  const injectContext = step >= 5
  const isPersonalized = step >= 6

  return (
    <SceneRoot reducedMotion={reducedMotion}>
      <Wire from={[24, 42]} to={[50, 42]} on={step >= 1} />
      <Wire from={[76, 42]} to={[50, 42]} on={injectContext} />

      {/* Cliente (Ana) */}
      <Show on x={24} y={42} from="left">
        <Card label="cliente">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <User size={16} color="#63b8de" />
            <span style={{ fontWeight: 600 }}>Ana (11 9999-1234)</span>
          </div>
        </Card>
      </Show>

      {/* Cérebro / Pip */}
      <Show on x={50} y={42} from="scale">
        <Core
          icon={<BrainCircuit />}
          name="Pip (LLM)"
          glow={step === 0 || injectContext || isPersonalized}
        />
      </Show>

      {/* Caderninho de Memória */}
      <Show on={showBook} x={76} y={42} from="right">
        <Card label="caderninho de memória">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f2c14e' }}>
              <BookMarked size={14} />
              <span>Perfil do cliente</span>
            </div>
            {showPreferences && (
              <>
                <span style={{ color: '#ea6a88' }}>• Alérgica a camarão</span>
                <span style={{ color: '#7fca84' }}>• Prefere pizza sem cebola</span>
              </>
            )}
          </div>
        </Card>
      </Show>

      {/* Mensagem da conversa atual */}
      <Show on={showShortTerm && !isPersonalized} x={50} y={68} from="bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <MessageSquare size={14} />
          <span>"Oi Pip, quero aquela pizza de sempre!"</span>
        </div>
      </Show>

      {/* Atendimento personalizado */}
      <Show on={isPersonalized} x={50} y={68} from="bottom">
        <Card label="atendimento com memória">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7fca84', fontSize: '12px' }}>
            <Sparkles size={16} />
            <span>"Oi Ana! Marguerita sem cebola, certo?"</span>
          </div>
        </Card>
      </Show>

      {/* Legenda de contexto */}
      <Show on={step === 0} x={50} y={20} from="none">
        <span className="sk-muted">Por padrão, APIs de LLM são stateless (sem memória entre chamadas)</span>
      </Show>
      <Show on={injectContext && !isPersonalized} x={50} y={20} from="none">
        <span className="sk-muted" style={{ color: '#63b8de' }}>Carregando dados salvos do cliente para o prompt</span>
      </Show>
    </SceneRoot>
  )
}
