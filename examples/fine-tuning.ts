// Tutorial "Fine-tuning": cada bloco abaixo aparece no passo a passo. Este arquivo existe para o
// TypeScript conferir que os trechos do tutorial compilam. Nada aqui chama a API: o SDK da
// Anthropic não tem endpoint de fine-tuning, então o treino em si acontece fora deste código.
import { readFile, writeFile } from 'node:fs/promises'

// 1. A pergunta que vem antes de tudo: você precisa mesmo?
export interface Diagnostico {
  /** o Pip erra por não saber algo (cardápio, preço, horário) */
  faltaInformacao: boolean
  /** o bilhete tem a regra, mas ele não a segue */
  regrasMalSeguidas: boolean
  /** o conteúdo está certo, mas o jeito de falar não é o da casa */
  jeitoDeFalarNaoPega: boolean
  /** você já colocou bons exemplos dentro do prompt */
  jaTentouExemplosNoPrompt: boolean
  /** você tem evals e centenas de exemplos reais aprovados por gente */
  temEvalsEExemplos: boolean
}

export function proximoPasso(d: Diagnostico): string {
  if (d.faltaInformacao) return 'Use RAG: dê ao modelo o documento certo na hora, em vez de ensinar de cor.'
  if (d.regrasMalSeguidas) return 'Melhore o bilhete de regras: seja específico e rode as evals de novo.'
  if (d.jeitoDeFalarNaoPega && !d.jaTentouExemplosNoPrompt) {
    return 'Coloque três a cinco bons exemplos dentro do prompt e meça com as evals.'
  }
  if (d.jeitoDeFalarNaoPega && d.temEvalsEExemplos) return 'Aí sim vale considerar fine-tuning.'
  return 'Antes de treinar, monte as evals e junte exemplos reais aprovados.'
}

// 2. Como é um conjunto de treino: arquivo JSONL com pares de mensagens
export interface Mensagem {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ExemploDeTreino {
  messages: Mensagem[]
}

export interface ConversaDoPip {
  id: string
  pergunta: string
  resposta: string
  /** uma pessoa leu e aprovou esta resposta */
  aprovadaPorGente: boolean
}

const BILHETE_CURTO = 'Você é o Pip, atendente da Pizzaria do Bairro.'

export function montarExemplo(conversa: ConversaDoPip): ExemploDeTreino {
  return {
    messages: [
      { role: 'system', content: BILHETE_CURTO },
      { role: 'user', content: conversa.pergunta.trim() },
      { role: 'assistant', content: conversa.resposta.trim() },
    ],
  }
}

export function validarExemplo(exemplo: ExemploDeTreino): string[] {
  const problemas: string[] = []
  const papeis = exemplo.messages.map((m) => m.role)
  if (papeis[papeis.length - 1] !== 'assistant') problemas.push('o último papel precisa ser assistant')
  if (!papeis.includes('user')) problemas.push('falta uma mensagem do cliente')
  if (exemplo.messages.some((m) => m.content.trim() === '')) problemas.push('há mensagem vazia')
  return problemas
}

export async function escreverJsonl(conversas: ConversaDoPip[], arquivo: string): Promise<number> {
  const linhas: string[] = []
  for (const conversa of conversas) {
    if (!conversa.aprovadaPorGente) continue
    const exemplo = montarExemplo(conversa)
    const problemas = validarExemplo(exemplo)
    if (problemas.length > 0) {
      console.warn(`Conversa ${conversa.id} descartada: ${problemas.join('; ')}`)
      continue
    }
    linhas.push(JSON.stringify(exemplo)) // uma linha de JSON por exemplo
  }
  await writeFile(arquivo, linhas.join('\n') + '\n')
  return linhas.length
}

// 3. Separe uma parte dos exemplos para teste
function numeroDoId(id: string): number {
  let n = 0
  for (const letra of id) n = (n * 31 + letra.charCodeAt(0)) % 1000
  return n
}

export function separar(conversas: ConversaDoPip[], porcentagemDeTeste = 20) {
  const treino: ConversaDoPip[] = []
  const teste: ConversaDoPip[] = []
  for (const conversa of conversas) {
    // o mesmo id sempre cai do mesmo lado, mesmo se você gerar o arquivo de novo
    if (numeroDoId(conversa.id) % 100 < porcentagemDeTeste) teste.push(conversa)
    else treino.push(conversa)
  }
  return { treino, teste }
}

export async function prepararArquivos(arquivoDeConversas: string): Promise<void> {
  const conversas = JSON.parse(await readFile(arquivoDeConversas, 'utf8')) as ConversaDoPip[]
  const { treino, teste } = separar(conversas)
  const nTreino = await escreverJsonl(treino, 'treino.jsonl')
  const nTeste = await escreverJsonl(teste, 'teste.jsonl')
  console.log(`treino.jsonl: ${nTreino} exemplos. teste.jsonl: ${nTeste} exemplos (o modelo não vê esses).`)
}

// 4. Onde o treino acontece: confira o provedor e faça a conta
export function estimarCusto(
  exemplos: ExemploDeTreino[],
  precoPorMilhaoDeTokens: number, // copie da página de preços do provedor que você escolheu
  passadasPeloConjunto: number, // quantas vezes o treino lê o conjunto inteiro
): number {
  const caracteres = exemplos.flatMap((e) => e.messages).reduce((soma, m) => soma + m.content.length, 0)
  const tokensAproximados = caracteres / 4 // regra de bolso para texto em português; o provedor conta de verdade
  return (tokensAproximados * passadasPeloConjunto * precoPorMilhaoDeTokens) / 1_000_000
}

// 5. Como saber se valeu: as mesmas evals, antes e depois
export async function valeu(
  rodarProva: (modelo: string) => Promise<number>, // a prova do assunto Evals, parametrizada pelo modelo
  modeloBase: string,
  modeloTreinado: string,
  ganhoMinimo = 0.1,
): Promise<boolean> {
  const antes = await rodarProva(modeloBase)
  const depois = await rodarProva(modeloTreinado)
  console.log(`Nota antes: ${antes}. Nota depois: ${depois}.`)
  return depois - antes >= ganhoMinimo
}
