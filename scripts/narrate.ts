/**
 * Gera a narração de cada assunto com o OmniVoice.
 *   pnpm narrate            → todos os assuntos prontos que tenham narration.json
 *   pnpm narrate llm rag    → só esses
 * Lê  src/content/topics/<id>/narration.json  ({ "lines": string[] })
 * Grava public/audio/<id>.m4a  e  src/content/topics/<id>/cues.json
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { TOPICS } from '../src/content/registry.ts'
import { GAP, buildCues } from '../src/narration/cues.ts'
import { REF_TEXT, VOICE_ID, batchLine, concatArgs, lineHash, voiceRefArgs } from './narrate-lib.ts'

const root = join(import.meta.dirname, '..')
const INFER = process.env.OMNIVOICE_BIN ?? join(homedir(), '.venvs/omnivoice/bin/omnivoice-infer')
const BATCH = join(dirname(INFER), 'omnivoice-infer-batch')
const cacheDir = join(root, 'audio-cache')
const voiceRef = join(cacheDir, 'voice-ref.wav')

function run(bin: string, args: string[], quiet = true): string {
  const r = spawnSync(bin, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', quiet ? 'pipe' : 'inherit'] })
  if (r.error) throw new Error(`Não consegui executar ${bin}: ${r.error.message}`)
  if (r.status !== 0) throw new Error(`${bin} saiu com código ${r.status}\n${r.stderr ?? ''}`)
  return r.stdout
}

function durationOf(file: string): number {
  return Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim())
}

function ensureVoiceRef() {
  if (existsSync(voiceRef)) return
  console.log('Criando a voz de referência (só na primeira vez)…')
  run(INFER, voiceRefArgs(voiceRef), false)
}

function narrate(id: string) {
  const dir = join(root, 'src/content/topics', id)
  const file = join(dir, 'narration.json')
  if (!existsSync(file)) {
    console.log(`${id}: sem narration.json, pulando`)
    return
  }
  const lines: string[] = JSON.parse(readFileSync(file, 'utf8')).lines
  if (!Array.isArray(lines) || lines.length === 0 || lines.some((l) => typeof l !== 'string' || !l.trim())) {
    throw new Error(`${id}: narration.json precisa de "lines" com frases não vazias`)
  }

  const wavs = lines.map((text) => join(cacheDir, `${lineHash(text, VOICE_ID)}.wav`))
  const missing = lines.map((text, i) => ({ text, wav: wavs[i] })).filter((x) => !existsSync(x.wav))
  const unique = [...new Map(missing.map((m) => [m.wav, m])).values()]

  if (unique.length) {
    const work = mkdtempSync(join(tmpdir(), 'narrate-'))
    const list = join(work, 'list.jsonl')
    const jobs = unique.map((m, i) => ({ ...m, id: `line${i}` }))
    writeFileSync(list, jobs.map((j) => batchLine({ id: j.id, text: j.text, refAudio: voiceRef, refText: REF_TEXT })).join('\n') + '\n')
    run(BATCH, ['--test_list', list, '--res_dir', work], false)
    for (const j of jobs) {
      const out = join(work, `${j.id}.wav`)
      if (!existsSync(out)) throw new Error(`${id}: o OmniVoice não gerou o áudio de "${j.text}"`)
      copyFileSync(out, j.wav)
    }
  }
  console.log(`${id}: ${unique.length} geradas, ${lines.length - unique.length} do cache`)

  const cues = buildCues(lines.map((text, i) => ({ text, duration: durationOf(wavs[i]) })), GAP)
  const out = join(root, 'public/audio', `${id}.m4a`)
  mkdirSync(dirname(out), { recursive: true })
  run('ffmpeg', concatArgs(wavs, GAP, out))
  writeFileSync(join(dir, 'cues.json'), JSON.stringify(cues, null, 2) + '\n')
  const total = cues.at(-1)!.end
  console.log(`${id}: ${lines.length} frases, ${total.toFixed(1)} s → public/audio/${id}.m4a (arquivo: ${durationOf(out).toFixed(1)} s)`)
}

const asked = process.argv.slice(2)
const ids = asked.length ? asked : TOPICS.filter((t) => t.status === 'ready').map((t) => t.id)
const unknown = ids.filter((id) => !TOPICS.some((t) => t.id === id))
if (unknown.length) {
  console.error(`Assunto desconhecido: ${unknown.join(', ')}`)
  process.exit(1)
}
mkdirSync(cacheDir, { recursive: true })
ensureVoiceRef()
for (const id of ids) narrate(id)
