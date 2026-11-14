// Tutorial "Cache": cada bloco abaixo aparece no passo a passo. Este arquivo existe para o
// TypeScript conferir que os trechos do tutorial compilam com o SDK instalado.
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic() // lê a chave de ANTHROPIC_API_KEY

// 1. A chave: perguntas parecidas viram a mesma chave
export function chaveDaPergunta(pergunta: string): string {
  return pergunta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira os acentos
    .replace(/[^a-z0-9 ]/g, ' ') // tira pontuação
    .replace(/\s+/g, ' ')
    .trim()
}

// 2. O caderno: um Map com validade em minutos
const VALIDADE_EM_MINUTOS = 60
const caderno = new Map<string, { resposta: string; venceEm: number }>()

export function buscarNoCaderno(chave: string): string | undefined {
  const anotacao = caderno.get(chave)
  if (!anotacao) return undefined
  if (Date.now() > anotacao.venceEm) {
    caderno.delete(chave) // venceu: apaga e finge que nunca esteve lá
    return undefined
  }
  return anotacao.resposta
}

export function anotarNoCaderno(chave: string, resposta: string): void {
  caderno.set(chave, { resposta, venceEm: Date.now() + VALIDADE_EM_MINUTOS * 60_000 })
}

// 3. Quando NÃO guardar
const SINAIS_DE_PERGUNTA_PESSOAL = [/meu pedido/i, /minha entrega/i, /meu endere[cç]o/i, /\bmeu\b|\bminha\b/i, /agora|hoje|já saiu/i]

export function podeGuardar(pergunta: string): boolean {
  return !SINAIS_DE_PERGUNTA_PESSOAL.some((sinal) => sinal.test(pergunta))
}

// 4. Consultar o caderno antes de chamar o modelo
export async function responder(pergunta: string): Promise<string> {
  const chave = chaveDaPergunta(pergunta)

  if (podeGuardar(pergunta)) {
    const pronta = buscarNoCaderno(chave)
    if (pronta) return pronta // saiu direto do caderno: sem chamar o modelo
  }

  const resposta = await claude.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    system: 'Você é o Pip, atendente da Pizzaria do Bairro. Responda em português, em poucas frases.',
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: pergunta }],
  })

  const texto = resposta.content
    .filter((bloco) => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('')

  if (resposta.stop_reason === 'end_turn' && podeGuardar(pergunta)) anotarNoCaderno(chave, texto)
  return texto
}

// 5. O outro cache: o cache de prompt, feito pela API
const CARDAPIO_E_REGRAS = `Você é o Pip, atendente da Pizzaria do Bairro.
(Aqui entram o cardápio completo, os preços, os horários e as regras da casa.
Esta parte é longa e igual em todas as conversas.)`

export async function responderComCachePrompt(pergunta: string): Promise<string> {
  const resposta = await claude.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    system: [{ type: 'text', text: CARDAPIO_E_REGRAS, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: pergunta }],
  })

  console.log('lidos do cache de prompt:', resposta.usage.cache_read_input_tokens)
  console.log('gravados no cache de prompt:', resposta.usage.cache_creation_input_tokens)

  return resposta.content
    .filter((bloco) => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('')
}

console.log(await responder('Até que horas vocês abrem?'))
console.log(await responder('até que horas vocês abrem'))
