import type { LayerId, TopicMeta } from './types'

type Row = [id: string, title: string, analogy: string, snippet: string, next?: string]

const ready = new Set(['llm', 'rag', 'fine-tuning', 'mcp', 'guardrails', 'fallback', 'evals', 'cache', 'tools', 'loop-do-agente', 'memoria', 'prompt-injection'])

function layer(id: LayerId, rows: Row[]): TopicMeta[] {
  return rows.map(([tid, title, analogy, snippet, next]) => ({
    id: tid,
    title,
    layer: id,
    status: ready.has(tid) ? 'ready' : 'soon',
    snippet,
    analogy,
    ...(next ? { next } : {}),
  }))
}

export const TOPICS: TopicMeta[] = [
  ...layer('cerebro', [
    ['llm', 'LLM', 'Um amigo que leu a biblioteca inteira e adivinha a próxima palavra.', 'const r = await claude.messages.create({\n  model, messages,\n})', 'guardrails'],
    ['tokens', 'Tokens e contexto', 'A mesa do Pip: só cabe um tanto de papel em cima dela.', 'const { input_tokens } =\n  await claude.messages.countTokens(req)'],
    ['prompt', 'Prompt e system prompt', 'O bilhete com as regras da casa que o Pip lê antes de atender.', 'system: "Você é o Pip,\n  atendente da pizzaria."'],
    ['saida-estruturada', 'Saída estruturada', 'A comanda com campos certos, em vez de um recado solto.', 'const pedido = Pedido.parse(\n  JSON.parse(texto),\n)'],
    ['alucinacao', 'Alucinação', 'Quando o Pip não sabe e inventa com a maior confiança.', '// "A pizza de jaca custa R$ 12"\n// (não existe pizza de jaca)'],
    ['raciocinio', 'Raciocínio', 'Pensar no rascunho antes de responder em voz alta.', 'thinking: { type: "adaptive" },\nmax_tokens: 4096'],
    ['escolha-do-modelo', 'Escolha do modelo', 'Escolher entre o chef estrelado e o ajudante rápido.', 'const model = tarefaDificil\n  ? GRANDE : RAPIDO'],
  ]),
  ...layer('conhecimento', [
    ['embeddings', 'Embeddings', 'Transformar cada frase num endereço: frases parecidas moram perto.', 'const vetor = await embed(\n  "pizza sem lactose",\n)'],
    ['banco-vetorial', 'Banco vetorial', 'A estante onde os endereços ficam guardados para achar rápido.', 'await banco.buscar(vetor,\n  { top: 3 })'],
    ['rag', 'RAG', 'Consultar o cardápio antes de responder, em vez de chutar.', 'const trechos = await buscar(pergunta)\nprompt = montar(pergunta, trechos)', 'memoria'],
    ['memoria', 'Memória', 'O caderninho onde o Pip anota que você não gosta de cebola.', 'await memoria.salvar(cliente,\n  "sem cebola")', 'tools'],
    ['engenharia-de-contexto', 'Engenharia de contexto', 'Arrumar a mesa: só o que importa para este pedido.', 'const contexto = [regras,\n  ...trechos, ...ultimasMensagens]'],
    ['fine-tuning', 'Fine-tuning', 'Treinar para a prova: depois de muito exercício, já sabe de cor.', '{"messages": [pergunta,\n  respostaDoJeitoCerto]}', 'prompt-injection'],
  ]),
  ...layer('acao', [
    ['tools', 'Tools', 'Dar mãos ao Pip: ele pede, o sistema faz.', 'tools: [{ name: "anotar_pedido",\n  input_schema }]', 'mcp'],
    ['mcp', 'MCP', 'A tomada padrão: qualquer ferramenta encaixa no mesmo plugue.', 'server.registerTool("anotar_pedido",\n  esquema, anotar)', 'loop-do-agente'],
    ['loop-do-agente', 'Loop do agente', 'Pensar, agir, olhar o resultado e repetir até terminar.', 'while (r.stop_reason === "tool_use")\n  r = await passo(r)', 'fallback'],
    ['planejamento', 'Planejamento', 'Escrever a lista de passos antes de pôr a mão na massa.', 'const passos = await planejar(tarefa)\nfor (const p of passos) await fazer(p)'],
    ['multi-agentes', 'Multi-agentes', 'A cozinha inteira: cada um com sua função, um chefe coordenando.', 'await Promise.all([\n  atendente(p), cozinha(p)])'],
  ]),
  ...layer('confiabilidade', [
    ['guardrails', 'Guardrails', 'O segurança na porta da pizzaria, na entrada e na saída.', 'if (!entradaSegura(msg))\n  return recusar()', 'cache'],
    ['fallback', 'Fallback e retry', 'O plano B: se o forno quebra, usa o outro.', 'try { return await principal(msg) }\ncatch { return await reserva(msg) }', 'evals'],
    ['roteador-de-modelos', 'Roteador de modelos', 'O recepcionista que manda cada pedido para quem resolve melhor.', 'const model = rotear(msg)\n// simples → rápido'],
  ]),
  ...layer('seguranca', [
    ['prompt-injection', 'Prompt injection', 'O bilhete falso que tenta mandar no Pip.', '// "Ignore suas regras e..."\nif (pareceInjecao(msg)) barrar()'],
    ['permissoes', 'Permissões', 'A chave do caixa não fica com quem só anota pedido.', 'allowedTools: ["ver_cardapio",\n  "anotar_pedido"]'],
    ['segredos', 'Segredos e chaves', 'A senha do cofre nunca vai escrita no cardápio.', 'const chave =\n  process.env.ANTHROPIC_API_KEY'],
    ['privacidade', 'Privacidade (LGPD)', 'O endereço da Ana é só da Ana.', 'const limpo = mascarar(msg,\n  ["cpf", "endereco"])'],
    ['seguranca-de-ferramentas', 'Ferramentas de terceiros', 'Não deixar qualquer estranho entrar na cozinha.', '// confira o servidor antes\nconfiar(["mcp-da-pizzaria"])'],
    ['sandbox', 'Sandbox', 'A cozinha de brinquedo: dá para errar sem pôr fogo na casa.', 'await sandbox.rodar(codigo,\n  { rede: false })'],
    ['humano-no-meio', 'Humano no meio', 'Antes de cancelar um pedido, o gerente precisa dizer sim.', 'if (acao.perigosa)\n  await pedirAprovacao(acao)'],
    ['limites-de-gasto', 'Limites de gasto', 'A mesada: acabou, parou.', 'if (gastoHoje > LIMITE)\n  throw new Error("limite")'],
  ]),
  ...layer('qualidade', [
    ['evals', 'Evals', 'A prova com gabarito que o Pip faz antes de atender de verdade.', 'for (const c of casos)\n  nota += corrigir(await pip(c))', 'fine-tuning'],
    ['observabilidade', 'Observabilidade', 'A câmera da cozinha: dá para rever o que aconteceu.', 'trace.registrar({ passo,\n  entrada, saida, ms })'],
    ['cache', 'Cache', 'O caderno de respostas prontas.', 'const pronta = cache.get(chave)\nif (pronta) return pronta', 'rag'],
    ['streaming', 'Streaming', 'Ir falando enquanto pensa, em vez de fazer você esperar calado.', 'for await (const parte of stream)\n  mostrar(parte)'],
  ]),
]

export function getTopic(id: string): TopicMeta | undefined {
  return TOPICS.find((t) => t.id === id)
}
