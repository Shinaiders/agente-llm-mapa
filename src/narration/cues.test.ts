import { buildCues, cueIndexAt, totalDuration } from './cues'

test('buildCues encadeia com intervalo', () => {
  expect(
    buildCues([
      { text: 'a', duration: 2 },
      { text: 'b', duration: 3 },
    ]),
  ).toEqual([
    { index: 0, text: 'a', start: 0, end: 2 },
    { index: 1, text: 'b', start: 2.25, end: 5.25 },
  ])
})

test('cueIndexAt', () => {
  const c = buildCues([
    { text: 'a', duration: 2 },
    { text: 'b', duration: 3 },
  ])
  expect([0, 2.1, 2.25, 99].map((t) => cueIndexAt(c, t))).toEqual([0, 0, 1, 1])
  expect(cueIndexAt([], 1)).toBe(-1)
})

test('totalDuration é o fim da última frase; vazio dá 0', () => {
  expect(totalDuration(buildCues([{ text: 'a', duration: 2 }, { text: 'b', duration: 3 }]))).toBe(5.25)
  expect(totalDuration([])).toBe(0)
})

test('buildCues não acumula erro de ponto flutuante', () => {
  const c = buildCues([0.1, 0.2, 0.3].map((d) => ({ text: 'x', duration: d })), 0.1)
  expect(c.at(-1)).toEqual({ index: 2, text: 'x', start: 0.5, end: 0.8 })
})
