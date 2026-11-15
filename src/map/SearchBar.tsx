import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { LAYERS } from '../content/layers'
import type { LayerId } from '../content/types'

interface SearchBarProps {
  query: string
  onQueryChange(q: string): void
  selectedLayer: LayerId | 'all'
  onLayerChange(l: LayerId | 'all'): void
  matchCount?: number
  totalCount?: number
}

export function SearchBar({ query, onQueryChange, selectedLayer, onLayerChange, matchCount, totalCount }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Pressionar '/' ou 'Cmd/Ctrl + K' foca a busca
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        if (query) onQueryChange('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [query, onQueryChange])

  const hasFilter = query.trim().length > 0 || selectedLayer !== 'all'

  return (
    <div className="map-search-bar" role="search" aria-label="Buscar e filtrar nós do mapa">
      <div className="search-input-wrapper">
        <Search size={15} className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar nós (pressione / para buscar)..."
          className="search-input"
          aria-label="Buscar nós do mapa"
        />
        {query && (
          <button type="button" onClick={() => onQueryChange('')} className="search-clear-btn" aria-label="Limpar busca" title="Limpar busca">
            <X size={14} aria-hidden="true" />
          </button>
        )}
        <kbd className="search-kbd" title="Atalho: / ou Ctrl+K">/</kbd>
      </div>

      <div className="layer-filter-pills" role="radiogroup" aria-label="Filtrar por camada">
        <button
          type="button"
          role="radio"
          aria-checked={selectedLayer === 'all'}
          className="layer-pill"
          onClick={() => onLayerChange('all')}
        >
          Todas
        </button>
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            type="button"
            role="radio"
            aria-checked={selectedLayer === layer.id}
            className="layer-pill"
            style={{ ['--pill-c' as string]: `var(${layer.colorVar})` }}
            onClick={() => onLayerChange(selectedLayer === layer.id ? 'all' : layer.id)}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {hasFilter && matchCount !== undefined && totalCount !== undefined && (
        <span className="search-count" role="status">
          {matchCount} de {totalCount} nós
        </span>
      )}
    </div>
  )
}
