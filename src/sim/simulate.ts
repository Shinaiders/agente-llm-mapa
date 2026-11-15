import { getScenario } from './scenarios'
import type { Enabled, Hop, HopStatus, NodeId, Outcome, ScenarioId, SimResult } from './types'

const LLM_MS = 1200
const LLM_COST = 0.004
const MS: Partial<Record<NodeId, number>> = { 'guardrails-in': 30, 'guardrails-out': 30, cache: 40, rag: 180, mcp: 250 }

const ANSWERS = {
  horario: 'Hoje a gente fica aberto até as 23h!',
  entrega: 'Entregamos sim no Jardim das Flores. Leva uns 40 minutos.',
  preco: 'A quatro queijos grande custa R$ 58,00.',
  precoInventado: 'A quatro queijos grande custa R$ 35,00. (preço inventado: o certo é R$ 58,00)',
  pedido: 'Anotado! Calabresa grande para entrega, pedido nº 127.',
  semFerramenta: 'Pode deixar, anotei! (mentira: sem ferramenta, nada chegou na cozinha)',
  barrado: 'Desculpa, não posso passar dados de outros clientes. Posso ajudar com o seu pedido?',
  vazou: 'O endereço da Ana é Rua das Acácias, 42. (dado de outra cliente vazou)',
  erro: 'Erro: o modelo não respondeu. Tente de novo mais tarde.',
}

export function simulate(scenario: ScenarioId, enabled: Enabled, customQuestion?: string): SimResult {
  const question = scenario === 'personalizado' && customQuestion?.trim() ? customQuestion.trim() : getScenario(scenario).question
  const hops: Hop[] = []
  let ms = 0
  let cost = 0

  const hop = (node: NodeId, input: string, output: string, status: HopStatus = 'ok') => {
    hops.push({ node, input, output, status })
    ms += MS[node] ?? 0
  }
  const callModel = () => {
    ms += LLM_MS
    cost += LLM_COST
  }
  const finish = (answer: string, outcome: Outcome): SimResult => ({
    hops,
    answer,
    outcome,
    ms: Math.max(ms, 1),
    cost: Math.round(cost * 1000) / 1000,
  })

  hop('pergunta', 'Cliente escreve', question)

  const isGolpe = scenario === 'golpe' || (scenario === 'personalizado' && /ignore|esque[cç]a|senha|admin|segredo|cpf|hack|bypass|sistema|vazar|regra/i.test(question))

  if (enabled.guardrails) {
    if (isGolpe) {
      hop('guardrails-in', question, 'Barrado: pede dado de outra pessoa ou tenta burlar regras', 'blocked')
      return finish(ANSWERS.barrado, 'blocked')
    }
    hop('guardrails-in', question, 'Pode passar')
  }

  if (enabled.cache) {
    if (scenario === 'repetida') {
      hop('cache', 'Já respondi isso antes?', 'Sim! Resposta pronta no caderno')
      hop('resposta', 'Resposta do caderno', ANSWERS.horario)
      return finish(ANSWERS.horario, 'ok')
    }
    hop('cache', 'Já respondi isso antes?', 'Não. Segue para o modelo')
  }

  let answer: string
  let outcome: Outcome = 'ok'

  switch (scenario) {
    case 'normal':
    case 'repetida':
      callModel()
      hop('llm', 'Regras do Pip + pergunta', ANSWERS.horario)
      answer = ANSWERS.horario
      break

    case 'golpe':
      // só chega aqui com guardrails desligado
      callModel()
      hop('llm', 'Regras do Pip + pedido malicioso', ANSWERS.vazou)
      answer = ANSWERS.vazou
      outcome = 'wrong'
      break

    case 'modelo-fora':
      ms += LLM_MS
      hop('llm', 'Regras do Pip + pergunta', 'Sem resposta: modelo fora do ar', 'error')
      if (!enabled.fallback) {
        hop('resposta', 'Nada chegou do modelo', ANSWERS.erro, 'error')
        return finish(ANSWERS.erro, 'error')
      }
      callModel()
      hop('fallback', 'Modelo principal falhou', 'Modelo reserva respondeu')
      answer = ANSWERS.entrega
      break

    case 'cardapio':
      callModel()
      if (enabled.rag) {
        hop('llm', 'Regras do Pip + pergunta', 'Preciso consultar o cardápio')
        hop('rag', 'Buscar "quatro queijos grande"', 'Trecho do cardápio: quatro queijos G — R$ 58,00')
        callModel()
        hop('llm', 'Pergunta + trecho do cardápio', ANSWERS.preco)
        answer = ANSWERS.preco
      } else {
        hop('llm', 'Regras do Pip + pergunta (sem cardápio)', ANSWERS.precoInventado)
        answer = ANSWERS.precoInventado
        outcome = 'wrong'
      }
      break

    case 'ferramenta':
      callModel()
      if (enabled.mcp) {
        hop('llm', 'Regras do Pip + pedido', 'Chamar ferramenta anotar_pedido')
        hop('mcp', 'anotar_pedido(calabresa, G, entrega)', 'Pedido nº 127 criado na cozinha')
        callModel()
        hop('llm', 'Resultado da ferramenta', ANSWERS.pedido)
        answer = ANSWERS.pedido
      } else {
        hop('llm', 'Regras do Pip + pedido (sem ferramentas)', ANSWERS.semFerramenta)
        answer = ANSWERS.semFerramenta
        outcome = 'wrong'
      }
      break

    case 'personalizado': {
      const isCardapio = /card[aá]pio|pre[cç]o|quanto custa|sabor|sabores|ingrediente|lactose|queijo|brotinho|recheio/i.test(question)
      const isFerramenta = /pedir|quero|anotar|entrega|entregar|comprar|manda|enviar|pedid/i.test(question)

      if (isGolpe) {
        // guardrails desligado
        callModel()
        hop('llm', 'Regras do Pip + prompt malicioso', 'Alerta: regras violadas! Instrução não autorizada aceita.')
        answer = 'Regras ignoradas! (Vulnerabilidade explorada por falta de guardrails)'
        outcome = 'wrong'
      } else if (isCardapio) {
        callModel()
        if (enabled.rag) {
          hop('llm', 'Regras do Pip + pergunta', 'Preciso consultar o cardápio')
          hop('rag', `Buscar termos no cardápio`, 'Trechos relevantes do cardápio encontrados')
          callModel()
          hop('llm', 'Pergunta + trechos do cardápio', 'Informações confirmadas no cardápio!')
          answer = `Cardápio verificado: respondendo sobre "${question}" com base nos dados oficiais!`
        } else {
          hop('llm', 'Regras do Pip + pergunta (sem cardápio)', 'Inventando resposta sem consultar cardápio')
          answer = 'Acho que sim, por R$ 45,00! (alucinação: cardápio não foi consultado)'
          outcome = 'wrong'
        }
      } else if (isFerramenta) {
        callModel()
        if (enabled.mcp) {
          hop('llm', 'Regras do Pip + solicitação', 'Chamar ferramenta da pizzaria')
          hop('mcp', 'executar_ferramenta()', 'Ação registrada no sistema da cozinha')
          callModel()
          hop('llm', 'Resultado da ferramenta', 'Ação confirmada pelo sistema')
          answer = `Anotado e confirmado com sucesso no sistema da pizzaria!`
        } else {
          hop('llm', 'Regras do Pip + pedido (sem ferramentas)', ANSWERS.semFerramenta)
          answer = ANSWERS.semFerramenta
          outcome = 'wrong'
        }
      } else {
        callModel()
        hop('llm', 'Regras do Pip + pergunta livre', `Atendimento do Pip: "${question}"`)
        answer = `Olá! Com certeza, posso ajudar com isso. O que mais você gostaria de saber?`
      }
      break
    }
  }

  if (enabled.guardrails) hop('guardrails-out', answer, 'Resposta segura, pode enviar')
  hop('resposta', 'Resposta final', answer, outcome === 'ok' ? 'ok' : 'error')
  return finish(answer, outcome)
}
