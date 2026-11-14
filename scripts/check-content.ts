import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TOPICS } from '../src/content/registry.ts'

const root = join(import.meta.dirname, '..')
const problems: string[] = []

for (const t of TOPICS.filter((x) => x.status === 'ready')) {
  const dir = join(root, 'src/content/topics', t.id)
  const need = ['narration.json', 'cues.json', 'Scene.tsx', 'tutorial.mdx']
  for (const f of need) if (!existsSync(join(dir, f))) problems.push(`${t.id}: falta ${f}`)
  if (!existsSync(join(root, 'public/audio', `${t.id}.m4a`))) problems.push(`${t.id}: falta public/audio/${t.id}.m4a`)

  const nPath = join(dir, 'narration.json')
  const cPath = join(dir, 'cues.json')
  if (existsSync(nPath)) {
    const lines: string[] = JSON.parse(readFileSync(nPath, 'utf8')).lines ?? []
    if (lines.length < 6 || lines.length > 10) problems.push(`${t.id}: narração tem ${lines.length} frases (precisa de 6 a 10)`)
    if (existsSync(cPath)) {
      const cues: unknown[] = JSON.parse(readFileSync(cPath, 'utf8'))
      if (cues.length !== lines.length) problems.push(`${t.id}: ${cues.length} cues para ${lines.length} frases — rode pnpm narrate ${t.id}`)
    }
  }
}

if (problems.length) {
  console.error(`Conteúdo incompleto:\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log('Conteúdo completo: todos os assuntos prontos têm cena, narração, áudio e tutorial.')
