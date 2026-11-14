import { createContext, useContext } from 'react'
import type { TopicMeta } from '../content/types'

export const TopicContext = createContext<TopicMeta | null>(null)
export const useTopic = () => useContext(TopicContext)
