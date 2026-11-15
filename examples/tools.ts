// Tutorial "Tools": execução de ferramentas e chamadas de função com Anthropic Claude
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic()

export const tools: Anthropic.Tool[] = [
  {
    name: 'anotar_pedido',
    description: 'Registra um novo pedido na cozinha da pizzaria e gera o número do pedido.',
    input_schema: {
      type: 'object',
      properties: {
        sabor: { type: 'string', description: 'Sabor da pizza, ex: calabresa, marguerita' },
        tamanho: { type: 'string', enum: ['broto', 'media', 'grande'], description: 'Tamanho da pizza' },
        entrega: { type: 'boolean', description: 'Se o pedido é para entrega a domicílio' },
      },
      required: ['sabor', 'tamanho'],
    },
  },
]

export async function processarPedido(mensagemCliente: string): Promise<string> {
  const mensagens: Anthropic.MessageParam[] = [{ role: 'user', content: mensagemCliente }]

  const resposta = await claude.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 1024,
    messages: mensagens,
    tools,
  })

  if (resposta.stop_reason === 'tool_use') {
    const toolCall = resposta.content.find((b) => b.type === 'tool_use')
    if (toolCall && toolCall.name === 'anotar_pedido') {
      const pedidoCriado = { id: 127, status: 'confirmado' }

      mensagens.push({ role: 'assistant', content: resposta.content })
      mensagens.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: JSON.stringify(pedidoCriado),
          },
        ],
      })

      const respostaFinal = await claude.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1024,
        messages: mensagens,
        tools,
      })

      return respostaFinal.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
    }
  }

  return resposta.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
}
