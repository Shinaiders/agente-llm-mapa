import { concatArgs, inferArgs, lineHash } from './narrate-lib'

test('frase com aspas, cifrão e quebra de linha vai intacta como um único argumento', () => {
  const t = 'Ele disse "oi" e pagou R$ 40\nna hora; `rm -rf` $(whoami)'
  const a = inferArgs({ text: t, output: 'o.wav', refAudio: 'r.wav', refText: 'x' })
  expect(a[a.indexOf('--text') + 1]).toBe(t)
})

test('inferArgs monta os argumentos do omnivoice-infer com a voz de referência', () => {
  expect(inferArgs({ text: 'oi', output: 'o.wav', refAudio: 'r.wav', refText: 'ref' })).toEqual([
    '--text', 'oi', '--output', 'o.wav', '--ref_audio', 'r.wav', '--ref_text', 'ref', '--language', 'pt',
  ])
})

test('lineHash muda com o texto e com a voz, e é estável', () => {
  expect(lineHash('oi', 'v1')).toBe(lineHash('oi', 'v1'))
  expect(lineHash('oi', 'v1')).not.toBe(lineHash('oi!', 'v1'))
  expect(lineHash('oi', 'v1')).not.toBe(lineHash('oi', 'v2'))
  expect(lineHash('oi', 'v1')).toMatch(/^[0-9a-f]{40}$/)
})

test('concatArgs intercala silêncio de 0.25 s e termina no arquivo de saída', () => {
  const a = concatArgs(['a.wav', 'b.wav', 'c.wav'], 0.25, 'out.m4a')
  expect(a.filter((x) => x === '-i')).toHaveLength(3)
  expect(a.at(-1)).toBe('out.m4a')
  const filter = a[a.indexOf('-filter_complex') + 1]
  expect(filter.match(/apad=pad_dur=0\.25/g)).toHaveLength(2) // sem silêncio depois da última
  expect(filter).toContain('concat=n=3:v=0:a=1')
  expect(a.join(' ')).toContain('-c:a aac -b:a 96k -ac 1')
})

test('concatArgs com uma frase só não aplica silêncio', () => {
  const filter = concatArgs(['a.wav'], 0.25, 'out.m4a')
  expect(filter.join(' ')).not.toContain('apad')
})

import { batchLine, voiceRefArgs } from './narrate-lib'

test('batchLine gera uma linha JSONL que preserva o texto exato', () => {
  const t = 'Ele disse "oi"\ne pagou R$ 40'
  const line = batchLine({ id: 'abc', text: t, refAudio: '/r.wav', refText: 'ref' })
  expect(line).not.toContain('\n')
  expect(JSON.parse(line)).toEqual({ id: 'abc', text: t, ref_audio: '/r.wav', ref_text: 'ref', language_id: 'pt' })
})

test('voiceRefArgs cria a voz por descrição, sem áudio de referência', () => {
  const a = voiceRefArgs('out.wav')
  expect(a).toContain('--instruct')
  expect(a).not.toContain('--ref_audio')
  expect(a[a.indexOf('--output') + 1]).toBe('out.wav')
})
