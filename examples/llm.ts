// Tutorial "LLM": cada bloco abaixo aparece no passo a passo. Este arquivo existe para o
// TypeScript conferir que os trechos do tutorial compilam com o SDK instalado.
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic() // lê a chave de ANTHROPIC_API_KEY

const REGRAS_DO_PIP = `Você é o Pip, atendente da Pizzaria do Bairro.
Responda em português, com simpatia e em poucas frases.
A pizzaria abre todo dia das 18h às 23h.
Se não souber alguma coisa, diga que vai verificar. Nunca invente.`

export async function perguntarAoPip(pergunta: string): Promise<string> {
  const resposta = await claude.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    system: REGRAS_DO_PIP,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: pergunta }],
  })

  if (resposta.stop_reason === 'refusal') {
    return 'Não posso ajudar com isso. Quer fazer um pedido?'
  }

  // A resposta vem em blocos. Só os blocos do tipo "text" têm o texto para mostrar.
  return resposta.content
    .filter((bloco) => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('')
}

console.log(await perguntarAoPip('Oi, Pip! Até que horas vocês ficam abertos hoje?'))
