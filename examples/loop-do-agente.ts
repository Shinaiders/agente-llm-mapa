// Tutorial "Loop do agente": orquestração do ciclo ReAct (pensar, agir, observar)
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic()

export const tools: Anthropic.Tool[] = [
  {
    name: 'consultar_preco',
    description: 'Consulta o preço unitário de um sabor de pizza.',
    input_schema: {
      type: 'object',
      properties: { sabor: { type: 'string' } },
      required: ['sabor'],
    },
  },
  {
    name: 'calcular_frete',
    description: 'Calcula o valor do frete e tempo de entrega para um bairro.',
    input_schema: {
      type: 'object',
      properties: { bairro: { type: 'string' } },
      required: ['bairro'],
    },
  },
]

async function executarFerramenta(nome: string, _args: Record<string, unknown>) {
  if (nome === 'consultar_preco') return { preco: 58.0 }
  if (nome === 'calcular_frete') return { frete: 10.0, minutos: 40 }
  throw new Error(`Ferramenta desconhecida: ${nome}`)
}

export async function rodarLoopDoAgente(perguntaCliente: string): Promise<string> {
  const mensagens: Anthropic.MessageParam[] = [{ role: 'user', content: perguntaCliente }]
  const MAX_ITERACOES = 5
  let iteracao = 0

  while (iteracao < MAX_ITERACOES) {
    iteracao++

    const resposta = await claude.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1024,
      messages: mensagens,
      tools,
    })

    if (resposta.stop_reason !== 'tool_use') {
      return resposta.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
    }

    mensagens.push({ role: 'assistant', content: resposta.content })

    const resultados: Anthropic.ToolResultBlockParam[] = []
    for (const bloco of resposta.content) {
      if (bloco.type === 'tool_use') {
        const resultado = await executarFerramenta(bloco.name, bloco.input as Record<string, unknown>)
        resultados.push({
          type: 'tool_result',
          tool_use_id: bloco.id,
          content: JSON.stringify(resultado),
        })
      }
    }

    mensagens.push({ role: 'user', content: resultados })
  }

  return 'Desculpe, não consegui finalizar todas as etapas a tempo.'
}
