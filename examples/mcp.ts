// Tutorial "MCP": cada bloco abaixo aparece no passo a passo. Este arquivo existe para o
// TypeScript conferir que os trechos do tutorial compilam com os pacotes instalados.
import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// 2. O servidor MCP, com a ferramenta anotar_pedido
let proximoNumero = 127

async function iniciarServidor() {
  const servidor = new McpServer({ name: 'cozinha-da-pizzaria', version: '1.0.0' })

  servidor.registerTool(
    'anotar_pedido',
    {
      description: 'Anota um pedido na cozinha da pizzaria e devolve o número do pedido.',
      inputSchema: {
        item: z.string().describe('O que o cliente pediu, por exemplo "calabresa grande"'),
        entrega: z.boolean().describe('true se for para entregar, false se for retirar'),
      },
    },
    async ({ item, entrega }) => {
      const numero = proximoNumero++
      console.error(`cozinha: pedido ${numero} anotado (${item}, ${entrega ? 'entrega' : 'retirada'})`)
      return { content: [{ type: 'text', text: `pedido nº ${numero}` }] }
    },
  )

  // stdio: o servidor lê e escreve mensagens pela entrada e saída do processo
  await servidor.connect(new StdioServerTransport())
}

// 3. O agente se liga ao servidor e lista as ferramentas
async function conectar() {
  const mcp = new Client({ name: 'pip', version: '1.0.0' })
  // o agente inicia o servidor como um processo filho (este mesmo arquivo, em modo servidor)
  await mcp.connect(new StdioClientTransport({ command: 'npx', args: ['tsx', 'mcp.ts', 'servidor'] }))

  const { tools } = await mcp.listTools()
  console.log('Ferramentas disponíveis:', tools.map((t) => t.name))
  return { mcp, tools }
}

// 4. Converter as ferramentas para o formato do Claude e rodar o laço
const claude = new Anthropic() // lê a chave de ANTHROPIC_API_KEY

export async function atenderPedido(pergunta: string): Promise<string> {
  const { mcp, tools } = await conectar()

  const ferramentas: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }))

  const mensagens: Anthropic.MessageParam[] = [{ role: 'user', content: pergunta }]

  while (true) {
    const resposta = await claude.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      system: 'Você é o Pip, atendente da Pizzaria do Bairro. Para anotar um pedido, use a ferramenta.',
      tools: ferramentas,
      messages: mensagens,
    })

    if (resposta.stop_reason !== 'tool_use') {
      await mcp.close()
      return resposta.content
        .filter((bloco) => bloco.type === 'text')
        .map((bloco) => bloco.text)
        .join('')
    }

    mensagens.push({ role: 'assistant', content: resposta.content })

    // todos os tool_result voltam juntos, numa única mensagem do usuário
    const resultados: Anthropic.ToolResultBlockParam[] = []
    for (const bloco of resposta.content) {
      if (bloco.type !== 'tool_use') continue
      const saida = await mcp.callTool({
        name: bloco.name,
        arguments: bloco.input as Record<string, unknown>,
      })
      resultados.push({
        type: 'tool_result',
        tool_use_id: bloco.id,
        content: JSON.stringify(saida.content),
        is_error: saida.isError === true,
      })
    }
    mensagens.push({ role: 'user', content: resultados })
  }
}

// 5. Conferir o resultado
if (process.argv[2] === 'servidor') {
  await iniciarServidor()
} else {
  console.log(await atenderPedido('Quero uma calabresa grande para entregar, por favor.'))
}
