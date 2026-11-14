import { formatHash, parseHash } from './useHashRoute'

test('parseHash', () => {
  expect(parseHash('')).toEqual({ name: 'map' })
  expect(parseHash('#/')).toEqual({ name: 'map' })
  expect(parseHash('#/assunto/rag')).toEqual({ name: 'topic', id: 'rag', journey: false })
  expect(parseHash('#/assunto/rag?viagem=1')).toEqual({ name: 'topic', id: 'rag', journey: true })
  expect(parseHash('#/assunto/fine-tuning/')).toEqual({ name: 'topic', id: 'fine-tuning', journey: false })
  expect(parseHash('#/qualquer-coisa')).toEqual({ name: 'map' })
})

test('formatHash é o inverso de parseHash', () => {
  for (const h of ['#/', '#/assunto/rag', '#/assunto/rag?viagem=1']) expect(formatHash(parseHash(h))).toBe(h)
})
