// Tutorial "RAG": cada bloco abaixo aparece no passo a passo. Este arquivo existe para o
// TypeScript conferir que os trechos do tutorial compilam com o SDK instalado.
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic() // lê a chave de ANTHROPIC_API_KEY

// 1. Quebrar o cardápio em pedaços pequenos
interface Trecho {
  id: number
  texto: string
}

const CARDAPIO = `Margherita grande: R$ 49,00
Quatro queijos grande: R$ 58,00
Quatro queijos broto: R$ 36,00
Calabresa grande: R$ 52,00
Borda recheada: acrescenta R$ 8,00
Entrega: grátis em pedidos acima de R$ 60,00`

// aqui cada linha vira um trecho; em cardápios maiores, corte por seção
const trechos: Trecho[] = CARDAPIO.split('\n').map((texto, id) => ({ id, texto }))

// 2. Buscar os pedaços mais parecidos com a pergunta
function palavras(texto: string): Set<string> {
  const limpo = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira acentos
    .replace(/[^a-z0-9 ]/g, ' ')
  return new Set(limpo.split(/\s+/).filter((p) => p.length > 2))
}

export function buscar(pergunta: string, quantos = 3): Trecho[] {
  const daPergunta = palavras(pergunta)
  return trechos
    .map((t) => ({ trecho: t, nota: [...palavras(t.texto)].filter((p) => daPergunta.has(p)).length }))
    .filter((x) => x.nota > 0)
    .sort((a, b) => b.nota - a.nota)
    .slice(0, quantos)
    .map((x) => x.trecho)
}

// 3. Montar o prompt com os trechos
function montarRegras(achados: Trecho[]): string {
  const cardapio = achados.map((t) => `[trecho ${t.id}] ${t.texto}`).join('\n')
  return `Você é o Pip, atendente da Pizzaria do Bairro. Responda em português, em poucas frases.
Responda SOMENTE com base nos trechos do cardápio abaixo.
Se a resposta não estiver nos trechos, diga "não sei" e que vai verificar.
Ao responder, cite o trecho usado, no formato [trecho N].

Trechos do cardápio:
${cardapio}`
}

// 4. Chamar o modelo
export async function perguntarComRag(pergunta: string): Promise<{ resposta: string; fontes: Trecho[] }> {
  const achados = buscar(pergunta)

  const resposta = await claude.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    system: montarRegras(achados),
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: pergunta }],
  })

  if (resposta.stop_reason === 'refusal') {
    return { resposta: 'Não posso ajudar com isso. Quer fazer um pedido?', fontes: [] }
  }

  const texto = resposta.content
    .filter((bloco) => bloco.type === 'text')
    .map((bloco) => bloco.text)
    .join('')

  // 5. Mostrar de qual trecho veio a resposta
  const citados = achados.filter((t) => texto.includes(`[trecho ${t.id}]`))
  return { resposta: texto, fontes: citados }
}

const { resposta, fontes } = await perguntarComRag('Quanto custa a quatro queijos grande?')
console.log(resposta)
console.log('Fontes:', fontes.map((t) => t.texto))
