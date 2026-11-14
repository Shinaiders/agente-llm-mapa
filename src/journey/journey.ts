import { getTopic } from '../content/registry'
import type { TopicId } from '../content/types'
import { topicOfNode } from '../map/layout'
import type { SimResult } from '../sim/types'

/** Assuntos fora da linha principal: entram no fim da viagem, como "bastidores". */
export const BACKSTAGE: TopicId[] = ['evals', 'fine-tuning']

/** Paradas da viagem: os assuntos prontos por onde o pedido passou, na ordem, e depois os bastidores. */
export function journeyOrder(result: SimResult): TopicId[] {
  const order: TopicId[] = []
  const add = (id: string) => {
    if (!order.includes(id) && getTopic(id)?.status === 'ready') order.push(id)
  }
  for (const hop of result.hops) add(topicOfNode(hop.node))
  for (const id of BACKSTAGE) add(id)
  return order
}
