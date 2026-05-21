/**
 * useQuestionTimer.ts — Hook for tracking per-question timing with multi-visit support
 * 
 * Handles:
 * - Starting a new visit for a question
 * - Ending the current visit and calculating duration
 * - Accumulating total time across multiple visits
 * - Displaying live timer for current visit
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { AssignmentStateManager } from '../services/assignmentPersistence'
import type { QuestionTiming, ActiveVisit } from '../types'

export function useQuestionTimer(
  assessmentId: string,
  questionId: string | null
) {
  const stateManager = useRef<AssignmentStateManager | null>(null)
  const [questionTiming, setQuestionTiming] = useState<QuestionTiming | null>(
    null
  )
  const [activeVisit, setActiveVisit] = useState<ActiveVisit | null>(null)
  const [visitDisplayTime, setVisitDisplayTime] = useState<number>(0) // in seconds
  const [totalDisplayTime, setTotalDisplayTime] = useState<number>(0) // in seconds

  // Initialize state manager
  useEffect(() => {
    if (!stateManager.current) {
      stateManager.current = new AssignmentStateManager(assessmentId)
    }
  }, [assessmentId])

  // Update live timer for current visit
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeVisit) {
        const now = new Date()
        const start = new Date(activeVisit.startTime)
        const elapsed = Math.round((now.getTime() - start.getTime()) / 1000)
        setVisitDisplayTime(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activeVisit])

  // Load question timing when question changes
  useEffect(() => {
    if (!stateManager.current || !questionId) {
      setQuestionTiming(null)
      setActiveVisit(null)
      setVisitDisplayTime(0)
      setTotalDisplayTime(0)
      return
    }

    const timing = stateManager.current.getOrCreateQuestionTiming(questionId)
    setQuestionTiming(timing)
    setTotalDisplayTime(timing.totalTimeSpent)

    // Start a new visit for this question
    const visit = stateManager.current.startQuestionVisit(questionId)
    setActiveVisit(visit)
    setVisitDisplayTime(0)
  }, [questionId])

  /**
   * End the current visit for this question and start a new one for next question
   */
  const endVisitAndSwitchQuestion = useCallback(
    (nextQuestionId: string | null) => {
      if (!stateManager.current || !questionId || !activeVisit) {
        return null
      }

      // End current visit
      const updatedTiming = stateManager.current.endQuestionVisit(
        questionId,
        activeVisit
      )

      // Reset for next question
      setActiveVisit(null)
      setVisitDisplayTime(0)

      // If there's a next question, load its timing
      if (nextQuestionId) {
        const nextTiming = stateManager.current.getOrCreateQuestionTiming(
          nextQuestionId
        )
        setQuestionTiming(nextTiming)
        setTotalDisplayTime(nextTiming.totalTimeSpent)

        const newVisit = stateManager.current.startQuestionVisit(nextQuestionId)
        setActiveVisit(newVisit)
        setVisitDisplayTime(0)
      }

      return updatedTiming
    },
    [questionId, activeVisit]
  )

  /**
   * Get the current timing state for export
   */
  const getTimingForExport = useCallback(() => {
    if (!stateManager.current || !questionId) return null
    return stateManager.current.getOrCreateQuestionTiming(questionId)
  }, [questionId])

  return {
    questionTiming,
    activeVisit,
    visitDisplayTime, // Time spent in current visit
    totalDisplayTime, // Total time spent on this question across all visits
    endVisitAndSwitchQuestion,
    getTimingForExport,
  }
}
