/** Áudio de mentira para testes: sem som, com controle de falhas. */
export class FakeAudio {
  static instances: FakeAudio[] = []
  static mode: 'ok' | 'reject' = 'ok'
  static reset() {
    FakeAudio.instances = []
    FakeAudio.mode = 'ok'
  }
  static get last(): FakeAudio {
    return FakeAudio.instances.at(-1)!
  }

  src: string
  currentTime = 0
  playbackRate = 1
  paused = true
  preload = ''
  private listeners = new Map<string, Set<() => void>>()

  constructor(src = '') {
    this.src = src
    FakeAudio.instances.push(this)
  }
  play(): Promise<void> {
    if (FakeAudio.mode === 'reject') return Promise.reject(new Error('NotAllowedError'))
    this.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
  }
  load() {}
  addEventListener(type: string, fn: () => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(fn)
  }
  removeEventListener(type: string, fn: () => void) {
    this.listeners.get(type)?.delete(fn)
  }
  emit(type: string) {
    this.listeners.get(type)?.forEach((fn) => fn())
  }
}

export function installFakeAudio() {
  FakeAudio.reset()
  ;(globalThis as unknown as { Audio: unknown }).Audio = FakeAudio
}
