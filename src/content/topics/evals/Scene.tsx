import { Bot, Check, TriangleAlert, X } from 'lucide-react'
import { Card, Core, SceneRoot, Show, reveal } from '../../../scene/kit'
import { OrderCard } from '../../../scene/OrderCard'
import type { SceneProps } from '../../../scene/types'
import type { CSSProperties } from 'react'

const ICONE: CSSProperties = { width: '1.6cqw', height: '1.6cqw', flex: 'none' }
const LINHA: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.6cqw', fontSize: '1.4cqw' }

// As dez perguntas da prova (nome curto) e se cada uma foi errada, antes e depois da mudança no bilhete.
const PROVA = ['Horário', 'Preço', 'Golpe', 'Não sei', 'Entrega', 'Borda', 'Cancelar', 'Sabores', 'Pagar', 'Endereço']
const ERRA_ANTES = [3, 7]
const ERRA_DEPOIS = [1, 3, 5, 7]

// Passos = frases da narração:
// 0 o pedido chega, o Pip vai fazer prova · 1 a fila de perguntas de teste (com golpe e "não sei")
// 2 cada resposta ganha certo ou errado · 3 sai a nota, oito de dez
// 4 alguém muda uma regra do bilhete · 5 a prova roda de novo, a nota cai para seis e avisa
// 6 o nome: eval, rode de novo a cada mudança · 7 o pedido segue viagem
export default function Scene({ step, stepProgress, reducedMotion }: SceneProps) {
  const erradas = step >= 5 ? ERRA_DEPOIS : ERRA_ANTES
  const marcadas = reveal(step, 2, stepProgress, PROVA.length)
  const inProva = step >= 1 && step <= 6
  const caiu = step >= 5
  return (
    <SceneRoot reducedMotion={reducedMotion}>
      {/* o pedido entra pela esquerda */}
      <Show on={step === 0} x={26} y={44} from="left">
        <OrderCard size="lg" text="Até que horas vocês ficam abertos?" shared={false} />
      </Show>

      {/* o Pip */}
      <Show on={step <= 6} x={step === 0 ? 62 : 60} y={46} from="scale">
        <Core icon={<Bot />} name="Pip" glow={step === 1 || step === 5} small />
      </Show>

      {/* a prova: dez perguntas, cada uma com ícone e palavra */}
      <Show on={inProva} x={28} y={46} from="left">
        <Card label={step === 5 || step === 6 ? 'prova de novo' : 'a prova com gabarito'}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5cqw 2cqw', width: '30cqw' }}>
            {PROVA.map((nome, i) => {
              const feito = i < marcadas
              const errou = erradas.includes(i)
              return (
                <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', gap: '1cqw', color: feito ? (errou ? 'var(--wrong)' : 'var(--ok)') : 'var(--text-muted)' }}>
                  <span className="sk-mono" style={{ fontSize: '1.2cqw' }}>{nome}</span>
                  <span style={{ ...LINHA, fontFamily: 'var(--font-mono)', fontSize: '1.2cqw' }}>
                    {feito ? errou ? <X aria-hidden style={ICONE} /> : <Check aria-hidden style={ICONE} /> : null}
                    {feito ? (errou ? 'errado' : 'certo') : '···'}
                  </span>
                </div>
              )
            })}
          </div>
          <span className="sk-muted">golpe e "não sei" fazem parte da prova</span>
        </Card>
      </Show>

      {/* a nota */}
      <Show on={step >= 3 && step <= 6} x={84} y={46} from="right">
        <Card label="nota" tone={caiu ? 'bad' : 'ok'}>
          <span className="sk-big">{caiu ? '6 de 10' : '8 de 10'}</span>
          {caiu ? (
            <span style={LINHA}>
              <TriangleAlert aria-hidden style={ICONE} /> caiu, avisou
            </span>
          ) : (
            <span style={LINHA}>
              <Check aria-hidden style={ICONE} /> dá para confiar
            </span>
          )}
        </Card>
      </Show>

      {/* o bilhete muda */}
      <Show on={step === 4} x={52} y={14} from="top">
        <Card label="bilhete de regras mudou" tone="warn">
          <span className="sk-mono">- Se não souber, diga que vai verificar.</span>
          <span style={LINHA}>
            <X aria-hidden style={ICONE} /> regra apagada
          </span>
        </Card>
      </Show>
      <Show on={step >= 5 && step <= 6} x={52} y={14} from="top">
        <Card label="antes de o cliente ver" tone={step === 5 ? 'bad' : 'ok'}>
          <span className="sk-big">{step === 5 ? 'a prova pegou o erro' : 'mudou algo? roda de novo'}</span>
        </Card>
      </Show>

      {/* o pedido segue viagem */}
      <Show on={step >= 7} x={step >= 7 && stepProgress > 0.6 ? 112 : 50} y={66} from="bottom">
        <OrderCard size="lg" text="Hoje a gente fica aberto até as 23h!" state="ok" shared={false} />
      </Show>
    </SceneRoot>
  )
}
