/**
 * useAssignmentTimer.ts — Hook for tracking overall assignment timing
 * 
 * Tracks:
 * - Assignment start time
 * - Assignment end time
 * - Total time spent (calculated)
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { AssignmentStateManager } from '../services/assignmentPersistence'
import type { AssignmentTimingPayload } from '../types'

export function useAssignmentTimer(assessmentId: string) {
  const stateManager = useRef<AssignmentStateManager | null>(null)
  const [state, setState] = useState<AssignmentTimingPayload | null>(null)
  const [displayTime, setDisplayTime] = useState<number>(0) // in seconds

  // Initialize state manager and load persisted state
  useEffect(() => {
    stateManager.current = new AssignmentStateManager(assessmentId)
    const initialState = stateManager.current.getState()
    setState(initialState)
  }, [assessmentId])

  // Update display timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (state && state.assignmentStartTime && !state.assignmentEndTime) {
        const now = new Date()
        const start = new Date(state.assignmentStartTime)
        const elapsed = Math.round((now.getTime() - start.getTime()) / 1000)
        setDisplayTime(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [state])

  const startAssignment = useCallback(() => {
    if (!stateManager.current) return

    const newState = stateManager.current.getState()
    newState.assignmentStartTime = new Date().toISOString()
    stateManager.current.saveState(newState)
    setState(newState)
    setDisplayTime(0)
  }, [])

  const completeAssignment = useCallback(() => {
    if (!stateManager.current) return
    const finalState = stateManager.current.completeAssignment()
    setState(finalState)
    return finalState
  }, [])

  const getExportState = useCallback(() => {
    if (!stateManager.current) return null
    return stateManager.current.exportState()
  }, [])

  return {
    state,
    displayTime,
    startAssignment,
    completeAssignment,
    getExportState,
  }
}
