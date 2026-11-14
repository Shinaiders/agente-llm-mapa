# Mapa do Agente LLM

Página interativa que ensina a montar um agente LLM. Um mapa mostra as peças
(LLM, guardrails, cache, RAG, MCP, fallback, evals, fine-tuning e outras) e o
caminho que um pedido faz por elas. Clicar numa peça abre o tutorial dela, com
uma cena animada narrada e o passo a passo com código.

O exemplo usado em tudo é o Pip, atendente de uma pizzaria.

## Rodar

```bash
pnpm install
pnpm dev        # abre em http://localhost:5173
pnpm test       # testes
pnpm build      # versão final em dist/
```

## Como está organizado

| Pasta | O que tem |
|---|---|
| `src/content/registry.ts` | Os 33 assuntos, em 6 camadas. `status: 'ready'` tem tutorial; `'soon'` aparece como "em breve". |
| `src/content/topics/<id>/` | Um assunto pronto: `narration.json`, `cues.json` (gerado), `Scene.tsx`, `tutorial.mdx`. |
| `src/sim/` | A simulação do mapa: cenário e peças ligadas viram caminho e resultado. Nenhum modelo é chamado. |
| `src/map/` | O mapa, os cenários, os interruptores e o cartão do pedido andando. |
| `src/scene/` | O motor de cena e as peças para montar cenas (`kit.tsx`). |
| `src/narration/` | O relógio que sincroniza a cena com o áudio. |
| `src/journey/` | O modo viagem, que toca as cenas em sequência passando pelo mapa. |
| `src/tutorial/` | A página do tutorial e os componentes usados no MDX. |
| `examples/` | O código de cada tutorial como arquivo `.ts`, conferido pelo TypeScript. |
| `public/audio/` | A narração de cada assunto. |

## Gerar a narração

A voz é feita com o [OmniVoice](https://github.com/k2-fsa/OmniVoice), instalado
em `~/.venvs/omnivoice` (ou aponte `OMNIVOICE_BIN` para o `omnivoice-infer`).
Precisa também de `ffmpeg`.

```bash
pnpm narrate            # todos os assuntos prontos
pnpm narrate rag mcp    # só esses
```

O script gera um áudio por frase, mede a duração de cada um e grava
`public/audio/<id>.m4a` e `src/content/topics/<id>/cues.json`. Frases que não
mudaram vêm do cache em `audio-cache/`. A voz é definida em
`scripts/narrate-lib.ts` (`VOICE_INSTRUCT`); o OmniVoice só aceita etiquetas
fixas em inglês ali. Trocar a voz invalida o cache e regenera tudo.

## Adicionar um assunto

1. Em `src/content/registry.ts`, coloque o id na lista `ready`.
2. Crie a pasta `src/content/topics/<id>/` com `narration.json`, `Scene.tsx` e
   `tutorial.mdx`. Use `llm` como molde.
3. Crie `examples/<id>.ts` com o código do tutorial.
4. Rode `pnpm narrate <id>`.
5. Rode `pnpm check` (confere se nada falta) e `pnpm test`.

Regras da cena: ela é função pura de `step` (a frase que está sendo narrada).
Cada elemento declara, por passo, se aparece e onde está. Sem estado, sem
timers. Assim, arrastar a barra para qualquer ponto mostra a cena certa.

O tutorial precisa das seções `## O que é`, `## Para que serve`,
`<OndeSeEncaixa />`, `## Como montar` e `## Erros comuns`, nessa ordem.

## Documentos

- Design: `docs/superpowers/specs/2026-11-14-mapa-agente-llm-design.md`
- Plano da etapa 1: `docs/superpowers/plans/2026-11-14-mapa-agente-llm-etapa-1.md`
