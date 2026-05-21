/**
 * assignmentPersistence.ts — Utilities for persisting and retrieving assignment state
 * from localStorage/sessionStorage.
 * 
 * This handles:
 * - Assignment timing state (startTime, endTime, totalSpent)
 * - Question timing data with visit history
 * - Current question index
 * - Active question visit
 * - Tab switch detection state
 */
import type {
  AssignmentTimingPayload,
  QuestionTiming,
  QuestionVisit,
  ActiveVisit,
  TabSwitchMonitorState,
} from '../types'

const STORAGE_PREFIX = 'rubricate_assignment_'

export class AssignmentStateManager {
  private assessmentId: string
  private storageKey: string

  constructor(assessmentId: string) {
    this.assessmentId = assessmentId
    this.storageKey = `${STORAGE_PREFIX}${assessmentId}`
  }

  /**
   * Initialize or retrieve the assignment timing state
   */
  getState(): AssignmentTimingPayload {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored) as AssignmentTimingPayload
      }
    } catch (err) {
      console.warn('Failed to retrieve assignment state:', err)
    }

    // Return fresh state
    return {
      assignmentId: this.assessmentId,
      assignmentStartTime: new Date().toISOString(),
      assignmentEndTime: null,
      totalTimeSpent: null,
      tabSwitchCount: 0,
      terminationReason: null,
      questions: [],
    }
  }

  /**
   * Save the entire assignment state
   */
  saveState(state: AssignmentTimingPayload): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state))
    } catch (err) {
      console.warn('Failed to save assignment state:', err)
    }
  }

  /**
   * Get or initialize question timing for a given question
   */
  getOrCreateQuestionTiming(questionId: string): QuestionTiming {
    const state = this.getState()
    const existing = state.questions.find(q => q.questionId === questionId)
    if (existing) return existing

    return {
      questionId,
      totalTimeSpent: 0,
      visits: [],
    }
  }

  /**
   * Start a new visit for a question
   */
  startQuestionVisit(questionId: string): ActiveVisit {
    const visit: ActiveVisit = {
      questionId,
      startTime: new Date().toISOString(),
    }
    return visit
  }

  /**
   * End the current question visit and save it
   */
  endQuestionVisit(
    questionId: string,
    activeVisit: ActiveVisit | null
  ): QuestionTiming | null {
    if (!activeVisit || activeVisit.questionId !== questionId) {
      return null
    }

    const state = this.getState()
    let questionTiming = state.questions.find(q => q.questionId === questionId)

    if (!questionTiming) {
      questionTiming = {
        questionId,
        totalTimeSpent: 0,
        visits: [],
      }
      state.questions.push(questionTiming)
    }

    // Close the active visit
    const endTime = new Date().toISOString()
    const startDate = new Date(activeVisit.startTime)
    const endDate = new Date(endTime)
    const duration = Math.round(
      (endDate.getTime() - startDate.getTime()) / 1000
    ) // in seconds

    const visit: QuestionVisit = {
      startTime: activeVisit.startTime,
      endTime,
      duration: Math.max(0, duration), // Ensure non-negative
    }

    questionTiming.visits.push(visit)
    questionTiming.totalTimeSpent += visit.duration ?? 0

    this.saveState(state)
    return questionTiming
  }

  /**
   * Get the current question index from storage
   */
  getCurrentQuestionIndex(): number {
    try {
      const key = `${STORAGE_PREFIX}current_idx_${this.assessmentId}`
      const stored = localStorage.getItem(key)
      return stored ? parseInt(stored, 10) : 0
    } catch {
      return 0
    }
  }

  /**
   * Save the current question index
   */
  setCurrentQuestionIndex(index: number): void {
    try {
      const key = `${STORAGE_PREFIX}current_idx_${this.assessmentId}`
      localStorage.setItem(key, String(index))
    } catch (err) {
      console.warn('Failed to save current question index:', err)
    }
  }

  /**
   * Complete the assignment and calculate total time
   */
  completeAssignment(): AssignmentTimingPayload {
    const state = this.getState()
    state.assignmentEndTime = new Date().toISOString()

    if (state.assignmentStartTime && state.assignmentEndTime) {
      const startDate = new Date(state.assignmentStartTime)
      const endDate = new Date(state.assignmentEndTime)
      state.totalTimeSpent = Math.round(
        (endDate.getTime() - startDate.getTime()) / 1000
      )
    }

    this.saveState(state)
    return state
  }

  /**
   * Clear the assignment state (after successful submission)
   */
  clearState(): void {
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(`${STORAGE_PREFIX}current_idx_${this.assessmentId}`)
    } catch (err) {
      console.warn('Failed to clear assignment state:', err)
    }
  }

  /**
   * Increment tab switch count
   */
  incrementTabSwitchCount(): AssignmentTimingPayload {
    const state = this.getState()
    state.tabSwitchCount += 1
    this.saveState(state)
    return state
  }

  /**
   * Terminate assignment due to tab switch limit
   */
  terminateDueToTabSwitch(): AssignmentTimingPayload {
    const state = this.getState()
    state.assignmentEndTime = new Date().toISOString()
    state.terminationReason = 'TAB_SWITCH_LIMIT_EXCEEDED'
    
    if (state.assignmentStartTime && state.assignmentEndTime) {
      const startDate = new Date(state.assignmentStartTime)
      const endDate = new Date(state.assignmentEndTime)
      state.totalTimeSpent = Math.round(
        (endDate.getTime() - startDate.getTime()) / 1000
      )
    }

    this.saveState(state)
    return state
  }

  /**
   * Export the current state for submission
   */
  exportState(): AssignmentTimingPayload {
    return this.getState()
  }
}
