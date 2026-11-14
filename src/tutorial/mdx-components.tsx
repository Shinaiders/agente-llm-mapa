import { Lightbulb, TriangleAlert } from 'lucide-react'
import { type ReactElement, type ReactNode, isValidElement } from 'react'
import { CodeBlock } from './CodeBlock'
import { OndeSeEncaixa } from './MiniMap'

function Pre({ children }: { children?: ReactNode }) {
  if (isValidElement(children)) {
    const el = children as ReactElement<{ className?: string; children?: ReactNode; title?: string }>
    const lang = el.props.className?.replace('language-', '')
    return <CodeBlock code={String(el.props.children ?? '').replace(/\n$/, '')} lang={lang} />
  }
  return <pre>{children}</pre>
}

/** Caixa de destaque: <Aviso tipo="dica|cuidado">…</Aviso> */
function Aviso({ tipo = 'dica', children }: { tipo?: 'dica' | 'cuidado'; children: ReactNode }) {
  return (
    <aside className="aviso" data-tipo={tipo}>
      {tipo === 'cuidado' ? <TriangleAlert size={18} aria-hidden="true" /> : <Lightbulb size={18} aria-hidden="true" />}
      <div>{children}</div>
    </aside>
  )
}

/** Comparação lado a lado: <AntesDepois antes="…" depois="…" /> */
function AntesDepois({ antes, depois }: { antes: ReactNode; depois: ReactNode }) {
  return (
    <div className="antes-depois">
      <div data-lado="antes">
        <span>Sem</span>
        <p>{antes}</p>
      </div>
      <div data-lado="depois">
        <span>Com</span>
        <p>{depois}</p>
      </div>
    </div>
  )
}

export const mdxComponents = { pre: Pre, OndeSeEncaixa, Aviso, AntesDepois }
