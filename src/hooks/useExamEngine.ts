'use client'

import { useReducer, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  ExamConfig,
  ExamAttemptState,
  QuestionState,
  QuestionStatus,
} from '@/types/exam'

// ─── Action Types ────────────────────────────────────────────────────────────

type ExamAction =
  | { type: 'SELECT_OPTION'; questionId: string; option: 'A' | 'B' | 'C' | 'D' }
  | { type: 'SAVE_AND_NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'MARK_FOR_REVIEW' }
  | { type: 'CLEAR_RESPONSE' }
  | { type: 'JUMP_TO_QUESTION'; sectionId: string; index: number }
  | { type: 'SWITCH_SECTION'; sectionId: string }
  | { type: 'TICK' }
  | { type: 'SUBMIT_EXAM' }
  | { type: 'MARK_AND_NEXT' }
  | { type: 'SET_NUMERIC_ANSWER'; value: string }

// ─── Status Derivation ───────────────────────────────────────────────────────

function deriveStatus(qs: QuestionState): QuestionStatus {
  const hasAnswer =
    qs.selectedOption !== null ||
    (qs.selectedOptions?.length ?? 0) > 0
  const marked = qs.isMarkedForReview
  if (hasAnswer && marked) return 'answered_and_marked'
  if (hasAnswer) return 'answered'
  if (marked) return 'marked_for_review'
  return 'visited_unanswered'
}

// ─── Initial State Factory ───────────────────────────────────────────────────

function buildInitialState(config: ExamConfig): ExamAttemptState {
  const questionStates: Record<string, QuestionState> = {}
  config.sections.forEach(section => {
    section.questions.forEach(q => {
      questionStates[q.id] = {
        questionId: q.id,
        selectedOption: null,
        isMarkedForReview: false,
        status: 'not_visited',
      }
    })
  })
  const firstQ = config.sections[0].questions[0]
  if (firstQ) {
    questionStates[firstQ.id].status = 'visited_unanswered'
  }
  return {
    examId: config.id,
    startedAt: Date.now(),
    questionStates,
    activeSectionId: config.sections[0].id,
    activeQuestionIndex: 0,
    isSubmitted: false,
    timeRemainingSeconds: config.totalDurationMinutes * 60,
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function examReducer(
  state: ExamAttemptState,
  action: ExamAction,
  config: ExamConfig
): ExamAttemptState {
  const activeSection = config.sections.find(s => s.id === state.activeSectionId)!
  const activeQuestion = activeSection.questions[state.activeQuestionIndex]
  const activeQId = activeQuestion?.id

  switch (action.type) {
    case 'SELECT_OPTION': {
      const question = activeSection.questions.find(
        q => q.id === action.questionId
      )
      const qs = { ...state.questionStates[action.questionId] }

      if (question?.type === 'mcq_multi') {
        const current = qs.selectedOptions ?? []
        const alreadySelected = current.includes(action.option)
        qs.selectedOptions = alreadySelected
          ? current.filter(o => o !== action.option)
          : [...current, action.option]
      } else {
        qs.selectedOption = action.option
      }

      qs.status = deriveStatus(qs)
      return {
        ...state,
        questionStates: { ...state.questionStates, [action.questionId]: qs },
      }
    }

    case 'SAVE_AND_NEXT': {
      const qs = { ...state.questionStates[activeQId] }

      // Save & Next clears mark flag per spec:
      // marked_for_review → visited_unanswered
      // answered_and_marked → answered
      qs.isMarkedForReview = false
      qs.status = deriveStatus(qs)

      const updatedStates = {
        ...state.questionStates,
        [activeQId]: qs,
      }

      const currentSectionIdx = config.sections.findIndex(
        s => s.id === state.activeSectionId
      )
      const isLastInSection =
        state.activeQuestionIndex >=
        activeSection.questions.length - 1

      // Mid-section: advance normally
      if (!isLastInSection) {
        const nextIndex = state.activeQuestionIndex + 1
        const nextQId =
          activeSection.questions[nextIndex].id
        const nextQs = { ...updatedStates[nextQId] }
        if (nextQs.status === 'not_visited') {
          nextQs.status = 'visited_unanswered'
          updatedStates[nextQId] = nextQs
        }
        return {
          ...state,
          questionStates: updatedStates,
          activeQuestionIndex: nextIndex,
        }
      }

      const isLastSection =
        currentSectionIdx === config.sections.length - 1

      // Last question of last section → wrap to Section 1 Q1
      if (isLastSection) {
        const firstSection = config.sections[0]
        const firstQId = firstSection.questions[0].id
        const wrappedStates = { ...updatedStates }
        const firstQs = { ...wrappedStates[firstQId] }
        if (firstQs.status === 'not_visited') {
          firstQs.status = 'visited_unanswered'
          wrappedStates[firstQId] = firstQs
        }
        return {
          ...state,
          questionStates: wrappedStates,
          activeSectionId: firstSection.id,
          activeQuestionIndex: 0,
        }
      }

      // Last question of non-final section
      // → advance to next section Q1 silently
      const nextSection =
        config.sections[currentSectionIdx + 1]
      const nextSectionFirstQId =
        nextSection.questions[0].id
      const advancedStates = { ...updatedStates }
      const nextSectionFirstQs = {
        ...advancedStates[nextSectionFirstQId],
      }
      if (nextSectionFirstQs.status === 'not_visited') {
        nextSectionFirstQs.status = 'visited_unanswered'
        advancedStates[nextSectionFirstQId] =
          nextSectionFirstQs
      }
      return {
        ...state,
        questionStates: advancedStates,
        activeSectionId: nextSection.id,
        activeQuestionIndex: 0,
      }
    }

    case 'PREVIOUS': {
      const isFirstQuestionInSection =
        state.activeQuestionIndex === 0
      const currentSectionIdx = config.sections.findIndex(
        s => s.id === state.activeSectionId
      )
      const isFirstSection = currentSectionIdx === 0

      // Disabled: Q1 of Section 1 — do nothing
      if (isFirstQuestionInSection && isFirstSection) {
        return state
      }

      // Cross-section: Q1 of Section N (N > 1)
      // → navigate to last question of Section N-1 silently
      if (isFirstQuestionInSection && !isFirstSection) {
        const prevSection =
          config.sections[currentSectionIdx - 1]
        const prevSectionLastIdx =
          prevSection.questions.length - 1
        const prevQId =
          prevSection.questions[prevSectionLastIdx].id
        const updatedStates = { ...state.questionStates }
        const prevQs = { ...updatedStates[prevQId] }
        if (prevQs.status === 'not_visited') {
          prevQs.status = 'visited_unanswered'
          updatedStates[prevQId] = prevQs
        }
        return {
          ...state,
          questionStates: updatedStates,
          activeSectionId: prevSection.id,
          activeQuestionIndex: prevSectionLastIdx,
        }
      }

      // Mid-section: navigate to previous question normally
      const prevIndex = state.activeQuestionIndex - 1
      const prevQId = activeSection.questions[prevIndex].id
      const updatedStates = { ...state.questionStates }
      const prevQs = { ...updatedStates[prevQId] }
      if (prevQs.status === 'not_visited') {
        prevQs.status = 'visited_unanswered'
        updatedStates[prevQId] = prevQs
      }
      return {
        ...state,
        questionStates: updatedStates,
        activeQuestionIndex: prevIndex,
      }
    }

    case 'MARK_FOR_REVIEW': {
      const qs = { ...state.questionStates[activeQId] }
      // One-directional — always marks, never unmarks
      qs.isMarkedForReview = true
      qs.status = deriveStatus(qs)
      return {
        ...state,
        questionStates: { ...state.questionStates, [activeQId]: qs },
      }
    }

    case 'CLEAR_RESPONSE': {
      const qs = { ...state.questionStates[activeQId] }
      qs.selectedOption = null
      qs.selectedOptions = []
      qs.numericAnswer = ''
      qs.status = qs.isMarkedForReview ? 'marked_for_review' : 'visited_unanswered'
      return {
        ...state,
        questionStates: { ...state.questionStates, [activeQId]: qs },
      }
    }

    case 'JUMP_TO_QUESTION': {
      const targetSection = config.sections.find(s => s.id === action.sectionId)!
      const targetQId = targetSection.questions[action.index].id
      const updatedStates = { ...state.questionStates }
      const targetQs = { ...updatedStates[targetQId] }
      if (targetQs.status === 'not_visited') {
        targetQs.status = 'visited_unanswered'
        updatedStates[targetQId] = targetQs
      }
      return {
        ...state,
        questionStates: updatedStates,
        activeSectionId: action.sectionId,
        activeQuestionIndex: action.index,
      }
    }

    case 'SWITCH_SECTION': {
      if (config.navigationPolicy !== 'free') return state
      const targetSection = config.sections.find(s => s.id === action.sectionId)!
      const firstQId = targetSection.questions[0].id
      const updatedStates = { ...state.questionStates }
      const firstQs = { ...updatedStates[firstQId] }
      if (firstQs.status === 'not_visited') {
        firstQs.status = 'visited_unanswered'
        updatedStates[firstQId] = firstQs
      }
      return {
        ...state,
        questionStates: updatedStates,
        activeSectionId: action.sectionId,
        activeQuestionIndex: 0,
      }
    }

    case 'TICK': {
      const next = state.timeRemainingSeconds - 1
      if (next <= 0) return { ...state, timeRemainingSeconds: 0, isSubmitted: true }
      return { ...state, timeRemainingSeconds: next }
    }

    case 'SUBMIT_EXAM':
      return { ...state, isSubmitted: true }

    case 'MARK_AND_NEXT': {
      // Step 1 — mark current question
      const qs = { ...state.questionStates[activeQId] }
      // One-directional — always marks, never unmarks
      // Bank exam / TCS / SSC compliant behaviour
      qs.isMarkedForReview = true
      qs.status = deriveStatus(qs)
      const updatedStates = {
        ...state.questionStates,
        [activeQId]: qs,
      }

      // Step 2 — advance to next question if not last
      const isLastInSection =
        state.activeQuestionIndex >=
        activeSection.questions.length - 1

      if (isLastInSection) {
        return { ...state, questionStates: updatedStates }
      }

      const nextIndex = state.activeQuestionIndex + 1
      const nextQId = activeSection.questions[nextIndex].id
      const nextQs = { ...updatedStates[nextQId] }
      if (nextQs.status === 'not_visited') {
        nextQs.status = 'visited_unanswered'
        updatedStates[nextQId] = nextQs
      }

      return {
        ...state,
        questionStates: updatedStates,
        activeQuestionIndex: nextIndex,
      }
    }

    case 'SET_NUMERIC_ANSWER': {
      const qs = {
        ...state.questionStates[activeQId],
        numericAnswer: action.value,
      }
      qs.status = action.value !== ''
        ? 'answered'
        : 'visited_unanswered'
      return {
        ...state,
        questionStates: {
          ...state.questionStates,
          [activeQId]: qs,
        },
      }
    }

    default:
      return state
  }
}

// ─── LocalStorage Key ────────────────────────────────────────────────────────

const storageKey = (examId: string) => `exam_attempt_${examId}`

// ─── Supabase attempt writer ──────────────────────────────────────────────────

async function writeAttemptToSupabase(
  userId: string,
  assessmentId: string,
  score: number,
  correctCount: number,
  incorrectCount: number,
  skippedCount: number,
  timeSpentSeconds: number,
  isFreeAttempt: boolean
) {
  try {
    const supabase = createClient()

    const { data: assessmentData } = await supabase
      .from('assessments')
      .select('id')
      .eq('slug', assessmentId)
      .limit(1)
      .single()

    if (!assessmentData) {
      console.warn('[Supabase] No assessment found for slug:', assessmentId)
      return
    }

    await supabase.from('attempts').insert({
      user_id: userId,
      assessment_id: assessmentData.id,
      attempt_number: isFreeAttempt ? 0 : 1,
      status: 'completed',
      score,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      skipped_count: skippedCount,
      time_spent_seconds: timeSpentSeconds,
      is_free_attempt: isFreeAttempt,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })

    if (isFreeAttempt) {
      await supabase
        .from('users')
        .update({ free_attempt_used: true })
        .eq('id', userId)
    }

    localStorage.setItem(
      `kss_free_attempt_used_${assessmentId}`,
      'true'
    )
  } catch (err) {
    console.error('[Supabase attempt write failed]', err)
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExamEngine(config: ExamConfig, userId: string) {
  const [state, dispatchRaw] = useReducer(
    (s: ExamAttemptState, a: ExamAction) => examReducer(s, a, config),
    undefined,
    () => {
      if (typeof window === 'undefined') return buildInitialState(config)
      try {
        const saved = localStorage.getItem(storageKey(config.id))
        if (saved) {
          const parsed: ExamAttemptState = JSON.parse(saved)
          if (!parsed.isSubmitted) return parsed
        }
      } catch {}
      return buildInitialState(config)
    }
  )

  // Persist on every state change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(config.id), JSON.stringify(state))
    } catch {}
  }, [state, config.id])

  // Timer
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (state.isSubmitted) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      dispatchRaw({ type: 'TICK' })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isSubmitted])

  // Derived values
  const activeSection = config.sections.find(s => s.id === state.activeSectionId)!
  const activeQuestion = activeSection.questions[state.activeQuestionIndex]
  const activeQuestionState = state.questionStates[activeQuestion.id]

  // Timer formatter
  const formattedTime = (() => {
    const t = state.timeRemainingSeconds
    const h = Math.floor(t / 3600)
    const m = Math.floor((t % 3600) / 60)
    const s = t % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return h > 0
      ? `${pad(h)}:${pad(m)}:${pad(s)}`
      : `${pad(m)}:${pad(s)}`
  })()

  // Actions
  const selectOption = useCallback(
    (option: 'A' | 'B' | 'C' | 'D') =>
      dispatchRaw({ type: 'SELECT_OPTION', questionId: activeQuestion.id, option }),
    [activeQuestion.id]
  )
  const saveAndNext = useCallback(() => dispatchRaw({ type: 'SAVE_AND_NEXT' }), [])
  const previous = useCallback(() => dispatchRaw({ type: 'PREVIOUS' }), [])
  const markForReview = useCallback(() => dispatchRaw({ type: 'MARK_FOR_REVIEW' }), [])
  const clearResponse = useCallback(() => dispatchRaw({ type: 'CLEAR_RESPONSE' }), [])
  const jumpToQuestion = useCallback(
    (sectionId: string, index: number) =>
      dispatchRaw({ type: 'JUMP_TO_QUESTION', sectionId, index }),
    []
  )
  const switchSection = useCallback(
    (sectionId: string) => dispatchRaw({ type: 'SWITCH_SECTION', sectionId }),
    []
  )
  const markAndNext = useCallback(
    () => dispatchRaw({ type: 'MARK_AND_NEXT' }),
    []
  )
  const setNumericAnswer = useCallback(
    (value: string) =>
      dispatchRaw({ type: 'SET_NUMERIC_ANSWER', value }),
    []
  )
  const submitExam = useCallback(() => {
    dispatchRaw({ type: 'SUBMIT_EXAM' })

    const allStates = Object.values(state.questionStates)
    const correctCount = allStates.filter(
      qs => qs.status === 'answered' ||
        qs.status === 'answered_and_marked'
    ).length
    const incorrectCount = allStates.filter(
      qs => qs.status === 'visited_unanswered'
    ).length
    const skippedCount = allStates.filter(
      qs => qs.status === 'not_visited'
    ).length
    const timeSpentSeconds =
      config.totalDurationMinutes * 60 -
      state.timeRemainingSeconds
    const isFreeAttempt = true

    writeAttemptToSupabase(
      userId,
      config.id,
      0,
      correctCount,
      incorrectCount,
      skippedCount,
      timeSpentSeconds,
      isFreeAttempt
    )
  }, [state, config, userId])

  return {
    state,
    config,
    activeSection,
    activeQuestion,
    activeQuestionState,
    selectOption,
    saveAndNext,
    previous,
    markForReview,
    markAndNext,
    clearResponse,
    jumpToQuestion,
    switchSection,
    submitExam,
    setNumericAnswer,
    formattedTime,
  }
}
