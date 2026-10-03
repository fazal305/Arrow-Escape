import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const subscribe = (callback) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

export default function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
