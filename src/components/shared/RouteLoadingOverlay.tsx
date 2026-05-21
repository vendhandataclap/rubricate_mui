import { useEffect, useRef, useState } from 'react'

const LOADER_DELAY_MS = 100

export default function RouteLoadingOverlay() {
  const [isLoading, setIsLoading] = useState(false)
  const pendingRequestsRef = useRef(0)
  const delayTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const originalFetch = window.fetch.bind(window)

    const startRequest = () => {
      pendingRequestsRef.current += 1

      if (pendingRequestsRef.current === 1) {
        delayTimerRef.current = window.setTimeout(() => {
          if (pendingRequestsRef.current > 0) {
            setIsLoading(true)
          }
        }, LOADER_DELAY_MS)
      }
    }

    const finishRequest = () => {
      pendingRequestsRef.current = Math.max(0, pendingRequestsRef.current - 1)

      if (pendingRequestsRef.current === 0) {
        if (delayTimerRef.current !== null) {
          window.clearTimeout(delayTimerRef.current)
          delayTimerRef.current = null
        }
        setIsLoading(false)
      }
    }

    const trackedFetch: typeof window.fetch = async (...args) => {
      startRequest()
      try {
        return await originalFetch(...args)
      } finally {
        finishRequest()
      }
    }

    window.fetch = trackedFetch

    return () => {
      window.fetch = originalFetch
      if (delayTimerRef.current !== null) {
        window.clearTimeout(delayTimerRef.current)
      }
      delayTimerRef.current = null
      pendingRequestsRef.current = 0
      setIsLoading(false)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="route-loader-overlay" role="status" aria-live="polite" aria-label="Loading page">
      <div className="route-loader-content">
        <div className="route-loader-spinner" />
        <p>Loading page...</p>
      </div>
    </div>
  )
}
