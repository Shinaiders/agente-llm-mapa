import { createHash } from 'node:crypto'

/** Mudar qualquer um destes dois troca a voz e invalida o cache de frases. */
// O OmniVoice só aceita etiquetas fixas em inglês (female, young adult, moderate pitch…), não descrição livre.
export const VOICE_INSTRUCT = 'female, young adult, moderate pitch'
export const REF_TEXT = 'Oi! Eu vou te mostrar como um agente de inteligência artificial funciona por dentro.'
export const VOICE_ID = createHash('sha1').update(`${VOICE_INSTRUCT}|${REF_TEXT}`).digest('hex').slice(0, 8)

export function lineHash(text: string, voiceId: string): string {
  return createHash('sha1').update(`${voiceId}\n${text}`).digest('hex')
}

export function voiceRefArgs(output: string): string[] {
  return ['--text', REF_TEXT, '--output', output, '--instruct', VOICE_INSTRUCT, '--language', 'pt']
}

export function inferArgs(o: { text: string; output: string; refAudio: string; refText: string }): string[] {
  return ['--text', o.text, '--output', o.output, '--ref_audio', o.refAudio, '--ref_text', o.refText, '--language', 'pt']
}

export function batchLine(o: { id: string; text: string; refAudio: string; refText: string }): string {
  return JSON.stringify({ id: o.id, text: o.text, ref_audio: o.refAudio, ref_text: o.refText, language_id: 'pt' })
}

/** Junta os WAVs das frases num arquivo só, com `gap` segundos de silêncio entre elas. */
export function concatArgs(wavs: string[], gap: number, output: string): string[] {
  const inputs = wavs.flatMap((w) => ['-i', w])
  const chains = wavs.map((_, i) => {
    const pad = i < wavs.length - 1 ? `,apad=pad_dur=${gap}` : ''
    return `[${i}:a]aresample=24000,aformat=channel_layouts=mono${pad}[a${i}]`
  })
  const filter = `${chains.join(';')};${wavs.map((_, i) => `[a${i}]`).join('')}concat=n=${wavs.length}:v=0:a=1[cat];[cat]loudnorm=I=-17:TP=-1.5:LRA=11,aresample=24000[out]`
  return ['-y', '-v', 'error', ...inputs, '-filter_complex', filter, '-map', '[out]', '-c:a', 'aac', '-b:a', '96k', '-ac', '1', output]
}
