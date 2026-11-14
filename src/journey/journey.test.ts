import { simulate } from '../sim/simulate'
import { ALL_ON } from '../sim/types'
import { BACKSTAGE, journeyOrder } from './journey'

test('ordem da viagem', () => {
  expect(journeyOrder(simulate('normal', ALL_ON))).toEqual(['guardrails', 'cache', 'llm', 'evals', 'fine-tuning'])
  expect(journeyOrder(simulate('cardapio', ALL_ON))).toEqual(['guardrails', 'cache', 'llm', 'rag', 'evals', 'fine-tuning'])
  expect(journeyOrder(simulate('golpe', ALL_ON))).toEqual(['guardrails', 'evals', 'fine-tuning'])
})

test('bastidores entram no fim e nada se repete', () => {
  expect(BACKSTAGE).toEqual(['evals', 'fine-tuning'])
  const order = journeyOrder(simulate('ferramenta', ALL_ON))
  expect(order).toEqual(['guardrails', 'cache', 'llm', 'mcp', 'evals', 'fine-tuning'])
  expect(new Set(order).size).toBe(order.length)
})

test('peça desligada não entra na viagem', () => {
  expect(journeyOrder(simulate('normal', { ...ALL_ON, guardrails: false, cache: false }))).toEqual(['llm', 'evals', 'fine-tuning'])
})
