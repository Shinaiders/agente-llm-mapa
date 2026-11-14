import { useCallback, useEffect, useState } from 'react'
import type { TopicId } from '../content/types'

export type Route = { name: 'map' } | { name: 'topic'; id: TopicId; journey: boolean }

export function parseHash(hash: string): Route {
  const m = hash.match(/^#\/assunto\/([a-z0-9-]+)\/?(?:\?(.*))?$/)
  if (!m) return { name: 'map' }
  return { name: 'topic', id: m[1], journey: new URLSearchParams(m[2] ?? '').get('viagem') === '1' }
}

export function formatHash(r: Route): string {
  return r.name === 'map' ? '#/' : `#/assunto/${r.id}${r.journey ? '?viagem=1' : ''}`
}

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = useCallback((r: Route) => {
    const hash = formatHash(r)
    if (window.location.hash !== hash) window.location.hash = hash
    setRoute(r)
  }, [])

  return [route, go]
}
