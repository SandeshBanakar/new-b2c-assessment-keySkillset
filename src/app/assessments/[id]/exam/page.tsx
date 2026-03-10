'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  X,
  Flag,
  Info,
  Monitor,
  Calculator as CalculatorIcon,
} from 'lucide-react'
import { useExamEngine } from '@/hooks/useExamEngine'
import { useAppContext } from '@/context/AppContext'
import clatFullTest1 from '@/data/exams/clat-full-test-1'
import neetFullTest1 from '@/data/exams/neet-full-test-1'
import type { ExamConfig } from '@/types/exam'

// ─── Config Registry ─────────────────────────────────────────────────────────

const examConfigRegistry: Record<string, ExamConfig> = {
  'clat-full-test-1': clatFullTest1,
  'neet-full-test-1': neetFullTest1,
}

function getExamConfig(id: string): ExamConfig | null {
  return examConfigRegistry[id] ?? null
}

// ─── Directions ───────────────────────────────────────────────────────────────

const DIRECTIONS = [
  'This exam is conducted in online mode only. Ensure a stable internet connection throughout.',
  'Do not switch browser tabs or windows during the exam. Tab switching may result in disqualification.',
  'The exam will auto-submit when the timer reaches 00:00:00.',
  'Use the Question Palette on the right to track your progress across all sections.',
  'Navigation between questions and sections is subject to the specific rules of this assessment.',
  'Mark for Review allows you to flag a question — marked questions are still counted if answered.',
  'Do not refresh the browser page during the exam. Your progress is saved automatically.',
  'Physical calculators, mobile phones, and electronic devices are not permitted.',
  'Read each question carefully. There is no option to retrieve responses after submission.',
]

// ─── Engine type alias ────────────────────────────────────────────────────────

type Engine = ReturnType<typeof useExamEngine>

// ─── ExamHeader ───────────────────────────────────────────────────────────────

function ExamHeader({
  engine,
  config,
  assessmentId,
  router,
}: {
  engine: Engine
  config: ExamConfig
  assessmentId: string
  router: ReturnType<typeof useRouter>
}) {
  const [showDirections, setShowDirections] = useState(false)

  return (
    <div className="shrink-0">
      {/* Row 1 — White: logo + exit */}
      <div className="bg-white border-b border-zinc-200 flex items-center justify-between px-4 h-12">
        <span className="text-blue-700 font-semibold text-base">keySkillset</span>
        <button
          onClick={() => {
            if (
              confirm(
                'Are you sure you want to exit? Your progress is saved automatically.'
              )
            ) {
              router.push(`/assessments/${assessmentId}`)
            }
          }}
          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded px-3 py-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Exit Exam
        </button>
      </div>

      {/* Row 2 — Dark: directions + section tabs + timer */}
      <div className="bg-blue-700 text-white flex items-center px-4 h-11 relative">

        {/* LEFT — Directions */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowDirections(v => !v)}
            className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white border border-white/20 rounded px-3 py-1 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            Directions
          </button>

          {showDirections && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDirections(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-md shadow-lg border border-zinc-200 z-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-900">Exam Directions</h3>
                  <button
                    onClick={() => setShowDirections(false)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ol className="space-y-2 text-xs text-zinc-600 leading-relaxed list-decimal list-inside max-h-64 overflow-y-auto">
                  {DIRECTIONS.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>

        {/* CENTER — Section tabs */}
        <div className="flex items-center justify-center gap-6 flex-1 overflow-x-auto px-4">
          {config.sections.map(section => {
            const answered = Object.values(engine.state.questionStates).filter(
              qs =>
                qs.questionId.startsWith(section.id) &&
                (qs.status === 'answered' || qs.status === 'answered_and_marked')
            ).length

            return (
              <button
                key={section.id}
                onClick={() => engine.switchSection(section.id)}
                className={`shrink-0 text-xs font-medium pb-1 border-b-2 transition-colors whitespace-nowrap ${
                  engine.state.activeSectionId === section.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/60 hover:text-white/80'
                }`}
              >
                {section.label.toUpperCase()} ({answered}/{section.questionCount})
              </button>
            )
          })}
        </div>

        {/* RIGHT — Timer */}
        <div className="flex items-center gap-1 font-mono text-sm shrink-0">
          <Clock className="w-4 h-4 text-white/70" />
          <span
            className={
              engine.state.timeRemainingSeconds < 300
                ? 'text-red-400 font-bold'
                : 'text-white'
            }
          >
            {engine.formattedTime}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── NumericPanel ─────────────────────────────────────────────────────────────

function NumericPanel({ engine }: { engine: Engine }) {
  const current = engine.activeQuestionState
  const value = (current.numericAnswer ?? '') as string

  function handleKey(key: string) {
    let next = value
    if (key === 'backspace') {
      next = value.slice(0, -1)
    } else if (key === '+') {
      // Explicitly set positive — remove leading minus
      next = value.startsWith('-') ? value.slice(1) : value
    } else if (key === '-') {
      // Prepend minus if not already negative and input is not empty
      next = (!value.startsWith('-') && value !== '') ? '-' + value : value
    } else if (key === '.') {
      if (!next.includes('.')) next = next + '.'
    } else {
      next = next + key
    }
    engine.setNumericAnswer(next)
  }

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['+', '-', '0', '.', 'backspace'],
  ]

  return (
    <div className="bg-white rounded-md border border-zinc-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-zinc-900">
          Question {engine.state.activeQuestionIndex + 1}
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          Numeric
        </span>
      </div>
      <p className="text-sm text-zinc-800 leading-relaxed mb-5">
        {engine.activeQuestion.text}
      </p>
      <input
        readOnly
        value={value}
        onKeyDown={e => e.preventDefault()}
        placeholder="Enter your answer"
        className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm font-mono text-zinc-900 bg-zinc-50 mb-4 cursor-not-allowed"
      />
      <div className="space-y-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-2">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="flex-1 border border-zinc-200 rounded-md py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {key === 'backspace' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── QuestionPanel ────────────────────────────────────────────────────────────

function QuestionPanel({ engine }: { engine: Engine }) {
  const qType = engine.activeQuestion.type

  const badgeLabel =
    qType === 'passage_based' ? 'Passage Based'
    : qType === 'mcq_multi' ? 'Multiple Correct'
    : 'Single Correct'

  // MCQ_MULTI: partial marking rules are content-creator
  // defined and evaluated server-side.
  // Client tracks selected options only.
  const selectedOptions = engine.activeQuestionState.selectedOptions ?? []

  return (
    <div className="bg-white rounded-md border border-zinc-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-gray-900">
          Question {engine.state.activeQuestionIndex + 1}
        </span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          {badgeLabel}
        </span>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed mb-5">
        {engine.activeQuestion.text}
      </p>

      {qType === 'mcq_multi' ? (
        engine.activeQuestion.options.map(option => {
          const isSelected = selectedOptions.includes(option.id)
          return (
            <button
              key={option.id}
              onClick={() => engine.selectOption(option.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-sm text-left mb-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-blue-700 bg-blue-50 text-blue-700 font-medium'
                  : 'border-zinc-200 hover:bg-blue-50 hover:border-blue-200 text-zinc-700'
              }`}
            >
              <span
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-semibold shrink-0 ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-zinc-100 text-gray-600'
                }`}
              >
                {isSelected ? '✓' : option.id}
              </span>
              {option.text}
            </button>
          )
        })
      ) : (
        engine.activeQuestion.options.map(option => {
          const isSelected =
            engine.activeQuestionState.selectedOption === option.id
          return (
            <button
              key={option.id}
              onClick={() => engine.selectOption(option.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border text-sm text-left mb-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-blue-700 bg-blue-50 text-blue-700 font-medium'
                  : 'border-zinc-200 hover:bg-blue-50 hover:border-blue-200 text-zinc-700'
              }`}
            >
              <span
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-semibold shrink-0 ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-zinc-100 text-gray-600'
                }`}
              >
                {option.id}
              </span>
              {option.text}
            </button>
          )
        })
      )}
    </div>
  )
}

// ─── QuestionArea ─────────────────────────────────────────────────────────────

function QuestionArea({
  engine,
  examContentRef,
}: {
  engine: Engine
  examContentRef: React.RefObject<HTMLDivElement | null>
}) {
  const qType = engine.activeQuestion.type

  return (
    <div ref={examContentRef} className="flex-1 overflow-y-auto bg-zinc-50 p-4">
      {qType === 'passage_based' ? (
        <div className="h-full flex gap-4">
          <div className="w-1/2 bg-white rounded-md border border-zinc-200 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Reading Passage
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {engine.activeQuestion.passage}
            </p>
          </div>
          <div className="w-1/2 overflow-y-auto">
            <QuestionPanel engine={engine} />
          </div>
        </div>
      ) : qType === 'numeric' ? (
        <div className="max-w-2xl mx-auto">
          <NumericPanel engine={engine} />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <QuestionPanel engine={engine} />
        </div>
      )}
    </div>
  )
}

// ─── PaletteSidebar ───────────────────────────────────────────────────────────

function PaletteSidebar({
  engine,
  config,
}: {
  engine: Engine
  config: ExamConfig
}) {
  const activeSection = config.sections.find(
    s => s.id === engine.state.activeSectionId
  )

  const allStates = Object.values(engine.state.questionStates)
  const answered = allStates.filter(
    s => s.status === 'answered' || s.status === 'answered_and_marked'
  ).length
  const notAnswered = allStates.filter(s => s.status === 'visited_unanswered').length
  const marked = allStates.filter(
    s => s.status === 'marked_for_review' || s.status === 'answered_and_marked'
  ).length
  const notVisited = allStates.filter(s => s.status === 'not_visited').length

  const legend = [
    { color: 'bg-zinc-100', label: 'Not Visited', flag: false },
    { color: 'bg-emerald-500', label: 'Answered', flag: false },
    { color: 'bg-rose-500', label: 'Not Answered', flag: false },
    { color: 'bg-violet-500', label: 'Marked for Review', flag: false },
    { color: 'bg-violet-500', label: 'Ans & Marked', flag: true },
  ]

  return (
    <aside className="w-64 shrink-0 bg-white border-l border-zinc-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
          Question Palette
        </p>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-1.5">
          {legend.map(({ color, label, flag }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded ${color} relative flex items-center justify-center`}>
                {flag && (
                  <Flag
                    className="absolute top-0 right-0 w-2 h-2 text-white"
                    fill="currentColor"
                  />
                )}
              </div>
              <span className="text-[10px] text-zinc-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {activeSection && (
          <div className="grid grid-cols-5 gap-1">
            {activeSection.questions.map((q, idx) => {
              const qs = engine.state.questionStates[q.id]
              const isActive = engine.state.activeQuestionIndex === idx

              const colorClass = (() => {
                if (isActive) return 'bg-blue-700 text-white'
                switch (qs?.status) {
                  case 'answered':
                    return 'bg-emerald-500 text-white'
                  case 'answered_and_marked':
                    return 'bg-violet-500 text-white'
                  case 'marked_for_review':
                    return 'bg-violet-500 text-white'
                  case 'visited_unanswered':
                    return 'bg-rose-500 text-white'
                  default:
                    return 'bg-zinc-100 text-zinc-500'
                }
              })()

              const showFlag = qs?.status === 'answered_and_marked'

              return (
                <button
                  key={q.id}
                  onClick={() => engine.jumpToQuestion(activeSection.id, idx)}
                  className={`w-9 h-9 rounded flex items-center justify-center text-xs font-medium relative cursor-pointer select-none transition-all hover:opacity-80 ${colorClass} ${
                    isActive ? 'ring-2 ring-blue-700 ring-offset-1' : ''
                  }`}
                >
                  {idx + 1}
                  {showFlag && (
                    <Flag
                      className="absolute top-0 right-0 w-2 h-2 text-white"
                      fill="currentColor"
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="grid grid-cols-2 gap-2 text-center mb-3">
          {[
            { val: answered, label: 'Answered', cls: 'text-emerald-600' },
            { val: notAnswered, label: 'Not Answered', cls: 'text-rose-500' },
            { val: marked, label: 'Marked', cls: 'text-violet-500' },
            { val: notVisited, label: 'Not Visited', cls: 'text-zinc-400' },
          ].map(({ val, label, cls }) => (
            <div key={label}>
              <p className={`text-base font-bold ${cls}`}>{val}</p>
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            if (
              confirm(
                'Are you sure you want to submit the exam? This action cannot be undone.'
              )
            ) {
              engine.submitExam()
            }
          }}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-md transition-colors"
        >
          Submit Exam
        </button>
      </div>
    </aside>
  )
}

// ─── ExamFooter ───────────────────────────────────────────────────────────────

function ExamFooter({ engine }: { engine: Engine }) {
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={engine.markAndNext}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md border transition-colors ${
            engine.activeQuestionState.isMarkedForReview
              ? 'bg-amber-50 border-amber-400 text-amber-700'
              : 'border-gray-300 text-gray-600 hover:bg-zinc-50'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Mark for Review & Next
        </button>

        <button
          onClick={engine.clearResponse}
          disabled={
            engine.activeQuestionState.selectedOption === null &&
            (engine.activeQuestionState.selectedOptions?.length ?? 0) === 0 &&
            !engine.activeQuestionState.numericAnswer
          }
          className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-4 h-4" />
          Clear Response
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={engine.previous}
          disabled={
            engine.state.activeQuestionIndex === 0 &&
            engine.config.sections.findIndex(s => s.id === engine.state.activeSectionId) === 0
          }
          className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={engine.saveAndNext}
          className="flex items-center gap-1.5 px-5 py-2 text-sm bg-blue-700 hover:bg-blue-700/90 text-white font-semibold rounded-md transition-colors"
        >
          Save & Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </footer>
  )
}

// ─── MobileBlockModal ─────────────────────────────────────────────────────────

function MobileBlockModal() {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-6">
      <div className="bg-white rounded-md shadow-lg max-w-sm w-full p-6 text-center">
        <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center mx-auto mb-4">
          <Monitor className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-base font-semibold text-zinc-900 mb-2">
          Heads up!
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed mb-6">
          You can do more on your phone, but on a bigger screen you can do it all day. Please use a laptop or tablet for a better exam experience!
        </p>
        <button
          onClick={() => router.push('/assessments')}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}

// ─── CalculatorWidget ─────────────────────────────────────────────────────────

function CalculatorWidget({
  btnPos,
  setBtnPos,
  examContentRef,
  btnPosReady,
}: {
  btnPos: { x: number; y: number }
  setBtnPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  examContentRef: React.RefObject<HTMLDivElement | null>
  btnPosReady: boolean
}) {
  const [isCalcOpen, setIsCalcOpen] = useState(false)
  const [display, setDisplay] = useState('0')
  const [prevValue, setPrevValue] = useState<string | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const dragging = useRef(false)
  const hasDragged = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    hasDragged.current = false
    dragOffset.current = {
      x: e.clientX - btnPos.x,
      y: e.clientY - btnPos.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    if (!examContentRef.current) return
    hasDragged.current = true

    const zone = examContentRef.current.getBoundingClientRect()
    const BUTTON_SIZE = 40
    const PADDING = 8

    const clamped = {
      x: Math.max(
        zone.left + PADDING,
        Math.min(zone.right - BUTTON_SIZE - PADDING, e.clientX - dragOffset.current.x)
      ),
      y: Math.max(
        zone.top + PADDING,
        Math.min(zone.bottom - BUTTON_SIZE - PADDING, e.clientY - dragOffset.current.y)
      ),
    }
    setBtnPos(clamped)
  }

  function onPointerUp() {
    dragging.current = false
  }

  // ── Calc logic ──

  function inputDigit(digit: string) {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  function inputDecimal() {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  function clear() {
    setDisplay('0')
    setPrevValue(null)
    setOperator(null)
    setWaitingForOperand(false)
  }

  function toggleSign() {
    const val = parseFloat(display)
    setDisplay(String(val * -1))
  }

  function percentage() {
    const val = parseFloat(display)
    setDisplay(String(val / 100))
  }

  function handleOperator(nextOp: string) {
    const current = parseFloat(display)
    if (prevValue !== null && operator && !waitingForOperand) {
      const result = calculate(parseFloat(prevValue), current, operator)
      setDisplay(String(result))
      setPrevValue(String(result))
    } else {
      setPrevValue(display)
    }
    setOperator(nextOp)
    setWaitingForOperand(true)
  }

  function calculate(a: number, b: number, op: string): number {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : 0
      default: return b
    }
  }

  function handleEquals() {
    if (prevValue === null || operator === null) return
    const current = parseFloat(display)
    const result = calculate(parseFloat(prevValue), current, operator)
    const resultStr = Number.isFinite(result) ? String(parseFloat(result.toPrecision(10))) : 'Error'
    setDisplay(resultStr)
    setPrevValue(null)
    setOperator(null)
    setWaitingForOperand(true)
  }

  const calcRows = [
    [
      { label: 'AC', action: clear, cls: 'bg-zinc-400 hover:bg-zinc-300 text-zinc-900' },
      { label: '+/-', action: toggleSign, cls: 'bg-zinc-400 hover:bg-zinc-300 text-zinc-900' },
      { label: '%', action: percentage, cls: 'bg-zinc-400 hover:bg-zinc-300 text-zinc-900' },
      { label: '÷', action: () => handleOperator('÷'), cls: 'bg-amber-400 hover:bg-amber-300 text-white' },
    ],
    [
      { label: '7', action: () => inputDigit('7'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '8', action: () => inputDigit('8'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '9', action: () => inputDigit('9'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '×', action: () => handleOperator('×'), cls: 'bg-amber-400 hover:bg-amber-300 text-white' },
    ],
    [
      { label: '4', action: () => inputDigit('4'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '5', action: () => inputDigit('5'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '6', action: () => inputDigit('6'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '-', action: () => handleOperator('-'), cls: 'bg-amber-400 hover:bg-amber-300 text-white' },
    ],
    [
      { label: '1', action: () => inputDigit('1'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '2', action: () => inputDigit('2'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '3', action: () => inputDigit('3'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '+', action: () => handleOperator('+'), cls: 'bg-amber-400 hover:bg-amber-300 text-white' },
    ],
    [
      { label: '0', action: () => inputDigit('0'), cls: 'bg-zinc-700 hover:bg-zinc-600 text-white col-span-2' },
      { label: '.', action: inputDecimal, cls: 'bg-zinc-700 hover:bg-zinc-600 text-white' },
      { label: '=', action: handleEquals, cls: 'bg-amber-400 hover:bg-amber-300 text-white' },
    ],
  ]

  return (
    <>
      {/* Panel */}
      {btnPosReady && (
        <div
          style={{
            position: 'fixed',
            left: btnPos.x - 108,
            top: btnPos.y - 328,
            zIndex: 50,
          }}
          className={`bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl w-64 overflow-hidden ${isCalcOpen ? 'block' : 'hidden'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 bg-zinc-800 select-none">
            <span className="text-xs font-medium text-zinc-400">Calculator</span>
            <button
              onClick={() => setIsCalcOpen(false)}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Display */}
          <div className="px-4 py-3 text-right">
            <span className="text-2xl font-light text-white truncate block">
              {display.length > 9 ? parseFloat(display).toExponential(3) : display}
            </span>
          </div>

          {/* Buttons */}
          <div className="px-2 pb-3 space-y-1.5">
            {calcRows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-4 gap-1.5">
                {row.map(({ label, action, cls }) => (
                  <button
                    key={label}
                    onClick={action}
                    className={`h-12 rounded-full text-sm font-semibold transition-colors ${cls}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger button */}
      {btnPosReady && (
        <div
          style={{
            position: 'fixed',
            left: btnPos.x,
            top: btnPos.y,
            zIndex: 40,
          }}
        >
          <button
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={() => {
              if (!hasDragged.current) {
                setIsCalcOpen(prev => !prev)
              }
              hasDragged.current = false
            }}
            className="w-10 h-10 rounded-md bg-blue-700 hover:bg-blue-800 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-colors select-none"
          >
            <CalculatorIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </>
  )
}

// ─── ExamPlayer (inner — calls useExamEngine unconditionally) ─────────────────

function ExamPlayer({
  config,
  assessmentId,
}: {
  config: ExamConfig
  assessmentId: string
}) {
  const router = useRouter()
  const { user } = useAppContext()
  const userId = user?.id ?? 'anonymous'
  const engine = useExamEngine(config, userId)

  const examContentRef = useRef<HTMLDivElement>(null)
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 })
  const [btnPosReady, setBtnPosReady] = useState(false)

  useEffect(() => {
    if (examContentRef.current) {
      const rect = examContentRef.current.getBoundingClientRect()
      setBtnPos({
        x: rect.right - 64,
        y: rect.bottom - 64,
      })
      setBtnPosReady(true)
    }
  }, [])

  useEffect(() => {
    if (engine.state.isSubmitted) {
      router.push(`/assessments/${assessmentId}/results`)
    }
  }, [engine.state.isSubmitted, assessmentId, router])

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <ExamHeader
        engine={engine}
        config={config}
        assessmentId={assessmentId}
        router={router}
      />
      <main className="flex flex-1 overflow-hidden">
        <QuestionArea engine={engine} examContentRef={examContentRef} />
        <PaletteSidebar engine={engine} config={config} />
      </main>
      <ExamFooter engine={engine} />
      <CalculatorWidget
        btnPos={btnPos}
        setBtnPos={setBtnPos}
        examContentRef={examContentRef}
        btnPosReady={btnPosReady}
      />
    </div>
  )
}

// ─── Page (default export) ────────────────────────────────────────────────────

export default function ExamPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const config = getExamConfig(params.id)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined'
      ? window.innerWidth < 768
      : false
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () =>
      window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!config) router.replace('/assessments')
  }, [config, router])

  if (!config) return null

  if (isMobile) return <MobileBlockModal />

  return <ExamPlayer config={config} assessmentId={params.id} />
}
