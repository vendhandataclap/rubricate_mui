/**
 * useTabSwitchMonitor.ts — Hook for detecting and handling tab switching
 * 
 * Features:
 * - Detects tab switches using visibilitychange API
 * - Shows warnings on first 2 switches
 * - Auto-terminates test on 3rd switch
 * - Persists state to localStorage
 * - Debounces to prevent duplicate increments
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { AssignmentStateManager } from '../services/assignmentPersistence'
import type { TabSwitchMonitorState } from '../types'
import { TAB_SWITCH_LIMIT } from '../types'

const TAB_SWITCH_DEBOUNCE_MS = 500

export function useTabSwitchMonitor(assessmentId: string) {
  const stateManager = useRef<AssignmentStateManager | null>(null)
  const [monitorState, setMonitorState] = useState<TabSwitchMonitorState | null>(null)
  const lastTriggerTimeRef = useRef<number>(0)
  const hasMountedRef = useRef<boolean>(false)
  const hasTerminatedRef = useRef<boolean>(false)
  const [showWarning, setShowWarning] = useState(false)

  // Initialize state manager
  useEffect(() => {
    if (!stateManager.current) {
      stateManager.current = new AssignmentStateManager(assessmentId)
      const assignmentState = stateManager.current.getState()
      setMonitorState({
        tabSwitchCount: assignmentState.tabSwitchCount,
        warningsShown: assignmentState.tabSwitchCount > TAB_SWITCH_LIMIT ? TAB_SWITCH_LIMIT : assignmentState.tabSwitchCount,
        isTerminated: assignmentState.terminationReason === 'TAB_SWITCH_LIMIT_EXCEEDED',
        terminationReason: assignmentState.terminationReason,
      })
      hasTerminatedRef.current = assignmentState.terminationReason === 'TAB_SWITCH_LIMIT_EXCEEDED'
    }
  }, [assessmentId])

  /**
   * Handle tab switch action immediately.
   */
  const handleTabSwitch = useCallback(() => {
    if (!stateManager.current || hasTerminatedRef.current) return

    const updatedState = stateManager.current.incrementTabSwitchCount()
    const newCount = updatedState.tabSwitchCount
    const isTerminated = newCount > TAB_SWITCH_LIMIT
    const warningsShown = isTerminated ? TAB_SWITCH_LIMIT : newCount

    // Immediate UI feedback for warning state (no async delay)
    if (!isTerminated) {
      setShowWarning(true)
    }

    if (isTerminated && !hasTerminatedRef.current) {
      hasTerminatedRef.current = true
      stateManager.current.terminateDueToTabSwitch()
      setShowWarning(false)
    }

    setMonitorState({
      tabSwitchCount: newCount,
      warningsShown,
      isTerminated,
      terminationReason: isTerminated ? 'TAB_SWITCH_LIMIT_EXCEEDED' : null,
    })
  }, [])

  /**
   * Guarded trigger to prevent duplicate events within debounce window.
   */
  const onTabSwitch = useCallback(() => {
    const now = Date.now()

    if (now - lastTriggerTimeRef.current < TAB_SWITCH_DEBOUNCE_MS) {
      return
    }
    lastTriggerTimeRef.current = now

    // Temporary debug log for verification during QA.
    console.log('Tab hidden:', document.hidden, now)
    handleTabSwitch()
  }, [handleTabSwitch])

  const handleTermination = useCallback(() => {
    if (!stateManager.current || hasTerminatedRef.current) return

    hasTerminatedRef.current = true
    const terminatedState = stateManager.current.terminateDueToTabSwitch()
    setShowWarning(false)
    setMonitorState({
      tabSwitchCount: terminatedState.tabSwitchCount,
      warningsShown: TAB_SWITCH_LIMIT,
      isTerminated: true,
      terminationReason: 'TAB_SWITCH_LIMIT_EXCEEDED',
    })
  }, [])

  /**
   * Dismiss warning modal
   */
  const dismissWarning = useCallback(() => {
    setShowWarning(false)
  }, [])

  useEffect(() => {
    hasMountedRef.current = true
    return () => {
      hasMountedRef.current = false
    }
  }, [])

  // Primary detection: visibilitychange
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!hasMountedRef.current) return
      if (document.hidden) {
        onTabSwitch()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onTabSwitch])

  // Secondary fallback only.
  useEffect(() => {
    const handleBlur = () => {
      if (!hasMountedRef.current) return
      if (document.hidden) {
        onTabSwitch()
      }
    }

    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('blur', handleBlur)
    }
  }, [onTabSwitch])

  return {
    monitorState,
    showWarning,
    dismissWarning,
    handleTermination,
  }
}
