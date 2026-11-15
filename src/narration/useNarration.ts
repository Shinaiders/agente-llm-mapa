import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Cue, cueIndexAt, totalDuration } from './cues'

export type Rate = 0.75 | 1 | 1.25 | 1.5
export const RATES: Rate[] = [0.75, 1, 1.25, 1.5]

export interface Narration {
  step: number
  /** 0..1 dentro da frase atual */
  stepProgress: number
  time: number
  duration: number
  playing: boolean
  ended: boolean
  /** true quando o áudio falhou ou foi bloqueado e o tempo é contado sem som */
  usingFallbackClock: boolean
  caption: string
  play(): void
  pause(): void
  seek(t: number): void
  restart(): void
  rate: Rate
  setRate(r: Rate): void
}

export function useNarration(audioSrc: string, cues: Cue[]): Narration {
  const duration = totalDuration(cues)
  const [time, setTimeState] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [usingFallbackClock, setFallbackState] = useState(false)
  const [rate, setRateState] = useState<Rate>(1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const brokenRef = useRef(false)
  const fallbackRef = useRef(false)
  const timeRef = useRef(0)
  const rateRef = useRef<Rate>(1)
  const durationRef = useRef(duration)
  const lastSpokenStepRef = useRef<number>(-1)
  durationRef.current = duration

  const speakCurrentCue = useCallback(
    (stepIdx: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      try {
        window.speechSynthesis.cancel()
        if (stepIdx < 0 || stepIdx >= cues.length) return
        const text = cues[stepIdx]?.text
        if (!text?.trim()) return
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'pt-BR'
        utterance.rate = rateRef.current
        window.speechSynthesis.speak(utterance)
      } catch {
        /* TTS indisponível ou bloqueado pelo navegador */
      }
    },
    [cues],
  )

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* noop */
      }
    }
  }, [])

  const setTime = useCallback((t: number) => {
    timeRef.current = t
    setTimeState(t)
  }, [])
  const setFallback = useCallback((on: boolean) => {
    fallbackRef.current = on
    setFallbackState(on)
  }, [])

  useEffect(() => {
    const audio = new Audio(audioSrc)
    audio.preload = 'auto'
    audioRef.current = audio
    brokenRef.current = false
    lastSpokenStepRef.current = -1
    setFallback(false)
    setTime(0)
    setPlaying(false)
    const onError = () => {
      brokenRef.current = true
      setFallback(true)
    }
    audio.addEventListener('error', onError)
    return () => {
      stopSpeech()
      audio.removeEventListener('error', onError)
      audio.pause()
      audioRef.current = null
    }
  }, [audioSrc, setFallback, setTime, stopSpeech])

  useEffect(() => {
    if (!playing) {
      stopSpeech()
      lastSpokenStepRef.current = -1
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      const dt = (now - last) / 1000
      last = now
      const audio = audioRef.current
      const t = fallbackRef.current || !audio ? timeRef.current + dt * rateRef.current : audio.currentTime
      if (t >= durationRef.current) {
        setTime(durationRef.current)
        stopSpeech()
        audio?.pause()
        setPlaying(false)
        return
      }
      setTime(t)

      // Se estiver usando o relógio de fallback/sem arquivo de áudio, sincroniza fala via Web Speech API
      if (fallbackRef.current) {
        const currentStep = cueIndexAt(cues, t)
        if (currentStep !== lastSpokenStepRef.current && currentStep >= 0) {
          lastSpokenStepRef.current = currentStep
          speakCurrentCue(currentStep)
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [playing, cues, setTime, speakCurrentCue, stopSpeech])

  const seek = useCallback(
    (t: number) => {
      const clamped = Math.min(Math.max(t, 0), durationRef.current)
      setTime(clamped)
      stopSpeech()
      lastSpokenStepRef.current = -1
      const audio = audioRef.current
      if (audio && !brokenRef.current) {
        try {
          audio.currentTime = clamped
        } catch {
          /* áudio ainda sem metadados: o play() acerta a posição */
        }
      }
    },
    [setTime, stopSpeech],
  )

  const play = useCallback(() => {
    if (durationRef.current <= 0) return
    if (timeRef.current >= durationRef.current) seek(0)
    const audio = audioRef.current
    if (!audio || brokenRef.current) {
      setFallback(true)
      setPlaying(true)
      return
    }
    try {
      audio.currentTime = timeRef.current
    } catch {
      /* idem */
    }
    audio.playbackRate = rateRef.current
    audio.play().then(
      () => {
        setFallback(false)
        setPlaying(true)
      },
      () => {
        setFallback(true)
        setPlaying(true)
      },
    )
  }, [seek, setFallback])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
  }, [])

  const restart = useCallback(() => seek(0), [seek])

  const setRate = useCallback((r: Rate) => {
    rateRef.current = r
    setRateState(r)
    if (audioRef.current) audioRef.current.playbackRate = r
  }, [])

  return useMemo(() => {
    const step = cueIndexAt(cues, time)
    const cue = step >= 0 ? cues[step] : undefined
    const span = cue ? cue.end - cue.start : 0
    const stepProgress = cue && span > 0 ? Math.min(Math.max((time - cue.start) / span, 0), 1) : 0
    return {
      step,
      stepProgress,
      time,
      duration,
      playing,
      ended: duration > 0 && time >= duration,
      usingFallbackClock,
      caption: cue?.text ?? '',
      play,
      pause,
      seek,
      restart,
      rate,
      setRate,
    }
  }, [cues, time, duration, playing, usingFallbackClock, rate, play, pause, seek, restart, setRate])
}
