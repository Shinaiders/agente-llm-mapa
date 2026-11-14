import { render } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TOPICS } from '../registry'
import type { SceneComponent } from '../../scene/types'

const scenes = import.meta.glob<{ default: SceneComponent }>('./*/Scene.tsx', { eager: true })
const dir = join(import.meta.dirname)

const ready = TOPICS.filter((t) => t.status === 'ready' && scenes[`./${t.id}/Scene.tsx`])

test('há pelo menos uma cena para testar', () => {
  expect(ready.length).toBeGreaterThan(0)
})

describe.each(ready.map((t) => [t.id]))('cena de %s', (id) => {
  const Scene = scenes[`./${id}/Scene.tsx`].default
  const lines: string[] = JSON.parse(readFileSync(join(dir, id, 'narration.json'), 'utf8')).lines

  test('narração tem de 6 a 10 frases curtas', () => {
    expect(lines.length).toBeGreaterThanOrEqual(6)
    expect(lines.length).toBeLessThanOrEqual(10)
    for (const l of lines) expect(l.length, l).toBeLessThanOrEqual(130)
  })

  test('renderiza todos os passos sem erro, no começo, no meio e no fim de cada frase', () => {
    for (const reducedMotion of [false, true])
      for (let step = 0; step < lines.length; step++)
        for (const stepProgress of [0, 0.5, 1]) {
          const r = render(<Scene step={step} stepProgress={stepProgress} reducedMotion={reducedMotion} />)
          expect(r.container.firstChild).not.toBeNull()
          r.unmount()
        }
  })

  test('é função pura do passo: ir e voltar dá o mesmo desenho', () => {
    const r = render(<Scene step={0} stepProgress={0} reducedMotion />)
    const first = r.container.innerHTML
    r.rerender(<Scene step={lines.length - 1} stepProgress={1} reducedMotion />)
    r.rerender(<Scene step={0} stepProgress={0} reducedMotion />)
    expect(r.container.innerHTML).toBe(first)
    r.unmount()
  })

  test('tem tutorial com as seções combinadas', () => {
    const file = join(dir, id, 'tutorial.mdx')
    expect(existsSync(file), 'tutorial.mdx').toBe(true)
    const mdx = readFileSync(file, 'utf8')
    const order = ['## O que é', '## Para que serve', '<OndeSeEncaixa />', '## Como montar', '## Erros comuns'].map((h) => mdx.indexOf(h))
    expect(order.every((i) => i >= 0), 'faltam seções').toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })
})
