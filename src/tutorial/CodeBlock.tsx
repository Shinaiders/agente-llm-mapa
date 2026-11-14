import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  code: string
  lang?: string
  /** nome do arquivo mostrado no topo */
  title?: string
}

type Highlighter = { codeToHtml(code: string, o: { lang: string; theme: string }): string }
let highlighter: Promise<Highlighter> | null = null
const LANGS = ['typescript', 'json', 'bash']
const ALIAS: Record<string, string> = { ts: 'typescript', tsx: 'typescript', js: 'typescript', sh: 'bash', jsonl: 'json' }

function getHighlighter(): Promise<Highlighter> {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, ts, json, bash, theme] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/bash.mjs'),
      import('shiki/themes/vesper.mjs'),
    ])
    return createHighlighterCore({ themes: [theme.default], langs: [ts.default, json.default, bash.default], engine: createJavaScriptRegexEngine() })
  })()
  return highlighter
}

export function CodeBlock({ code, lang = 'ts', title }: Props) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const language = ALIAS[lang] ?? lang

  useEffect(() => {
    let alive = true
    if (!LANGS.includes(language)) return
    getHighlighter()
      .then((h) => alive && setHtml(h.codeToHtml(code, { lang: language, theme: 'vesper' })))
      .catch(() => {
        /* sem cores: o código puro continua visível */
      })
    return () => {
      alive = false
    }
  }, [code, language])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      /* clipboard indisponível: o texto continua selecionável */
    }
  }

  return (
    <div className="code-block">
      <div className="code-head">
        <span>{title ?? language}</span>
        <button type="button" onClick={copy} aria-label={copied ? 'Copiado' : 'Copiar'}>
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      {html ? (
        <div className="code-body" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="code-body">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
