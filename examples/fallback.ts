// Tutorial "Fallback e retry": cada bloco abaixo aparece no passo a passo. Este arquivo existe para o
// TypeScript conferir que os trechos do tutorial compilam com o SDK instalado.
import Anthropic from '@anthropic-ai/sdk'

// 1. O que o SDK já faz sozinho
const claude = new Anthropic({ maxRetries: 2 }) // 2 já é o padrão; mude se quiser mais ou menos

// 2. Tentar de novo com espera crescente, só quando vale a pena
const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms))

function valeTentarDeNovo(erro: unknown): boolean {
  if (erro instanceof Anthropic.RateLimitError) return true // limite de requisições
  if (erro instanceof Anthropic.APIConnectionError) return true // a conexão caiu
  if (erro instanceof Anthropic.APIError) return (erro.status ?? 0) >= 500 // problema do lado deles
  return false // erro 400 e parentes: o pedido está errado, repetir não adianta
}

async function chamarComRetry(modelo: string, mensagem: string, limite: number): Promise<string> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const restante = limite - Date.now()
    if (restante <= 0) throw new Error('acabou o tempo')

    try {
      const resposta = await claude.messages.create(
        {
          model: modelo,
          max_tokens: 16000,
          system: 'Você é o Pip, atendente da Pizzaria do Bairro. Responda em português, em poucas frases.',
          messages: [{ role: 'user', content: mensagem }],
        },
        { maxRetries: 0, timeout: restante }, // o retry agora é nosso
      )
      return resposta.content
        .filter((bloco) => bloco.type === 'text')
        .map((bloco) => bloco.text)
        .join('')
    } catch (erro) {
      if (!valeTentarDeNovo(erro) || tentativa === 2) throw erro
      await esperar(1000 * 2 ** tentativa + Math.random() * 250) // 1 s, 2 s, 4 s... e um pouco de sorteio
    }
  }
  throw new Error('não chega aqui')
}

// 3. A lista de modelos reserva
const MODELOS = ['claude-opus-5-5', 'claude-haiku-5-5']

async function tentarOsModelos(mensagem: string, limite: number): Promise<string> {
  let ultimoErro: unknown
  for (const modelo of MODELOS) {
    try {
      return await chamarComRetry(modelo, mensagem, limite)
    } catch (erro) {
      ultimoErro = erro
      console.warn(`modelo ${modelo} falhou, passando para o próximo`)
    }
  }
  throw ultimoErro
}

// 4. A resposta de emergência
const RESPOSTA_DE_EMERGENCIA = 'Estamos com um probleminha por aqui. Tente de novo em instantes ou ligue para a loja.'

// 5. O limite de tempo total, juntando tudo
const LIMITE_TOTAL_EM_MS = 20_000

export async function atender(mensagem: string): Promise<string> {
  const limite = Date.now() + LIMITE_TOTAL_EM_MS
  try {
    return await tentarOsModelos(mensagem, limite)
  } catch {
    return RESPOSTA_DE_EMERGENCIA
  }
}

console.log(await atender('Até que horas vocês abrem?'))
