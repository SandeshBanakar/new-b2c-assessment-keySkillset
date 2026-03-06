'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  X,
} from 'lucide-react'
import { useExamEngine } from '@/hooks/useExamEngine'
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
  return (
    <header className="bg-[#1E3A5F] text-white flex items-center px-4 shrink-0 h-14">
      <div className="flex items-center gap-6 flex-1 overflow-x-auto">
        <span className="font-bold text-sm shrink-0">keySkillset</span>

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

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1 font-mono text-sm">
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
          className="flex items-center gap-1 text-xs text-white/70 hover:text-white border border-white/30 rounded px-3 py-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Exit Exam
        </button>
      </div>
    </header>
  )
}

// ─── QuestionPanel ────────────────────────────────────────────────────────────

function QuestionPanel({ engine }: { engine: Engine }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-gray-900">
          Question {engine.state.activeQuestionIndex + 1}
        </span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          {engine.activeQuestion.type === 'passage_based'
            ? 'Passage Based'
            : 'Single Correct'}
        </span>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed mb-5">
        {engine.activeQuestion.text}
      </p>

      {engine.activeQuestion.options.map(option => {
        const isSelected =
          engine.activeQuestionState.selectedOption === option.id

        return (
          <button
            key={option.id}
            onClick={() => engine.selectOption(option.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left mb-2 transition-all cursor-pointer ${
              isSelected
                ? 'border-2 border-[#1E3A5F] bg-blue-50 text-[#1E3A5F] font-medium'
                : 'border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-700'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                isSelected
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {option.id}
            </span>
            {option.text}
          </button>
        )
      })}
    </div>
  )
}

// ─── QuestionArea ─────────────────────────────────────────────────────────────

function QuestionArea({ engine }: { engine: Engine }) {
  const isPassage = engine.activeQuestion.type === 'passage_based'

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      {isPassage ? (
        <div className="h-full flex gap-4">
          <div className="w-1/2 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Reading Passage
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {engine.activeQuestion.passage}
            </p>
          </div>
          <div className="w-1/2 overflow-y-auto">
            <QuestionPanel engine={engine} />
          </div>
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
  const allStates = Object.values(engine.state.questionStates)
  const answered = allStates.filter(
    s => s.status === 'answered' || s.status === 'answered_and_marked'
  ).length
  const notAnswered = allStates.filter(s => s.status === 'visited_unanswered').length
  const marked = allStates.filter(
    s => s.status === 'marked_for_review' || s.status === 'answered_and_marked'
  ).length
  const notVisited = allStates.filter(s => s.status === 'not_visited').length

  return (
    <aside className="w-64 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Question Palette
        </p>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { color: 'bg-gray-200', label: 'Not Visited' },
            { color: 'bg-red-400', label: 'Not Answered' },
            { color: 'bg-green-500', label: 'Answered' },
            { color: 'bg-amber-400', label: 'Marked' },
            { color: 'bg-purple-500', label: 'Ans & Marked' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${color}`} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {config.sections.map(section => (
          <div key={section.id}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              {section.label}
            </p>
            <div className="grid grid-cols-5 gap-1">
              {section.questions.map((q, idx) => {
                const qs = engine.state.questionStates[q.id]
                const isActive =
                  engine.state.activeSectionId === section.id &&
                  engine.state.activeQuestionIndex === idx

                const bgColor = (() => {
                  if (isActive) return 'bg-[#1E3A5F] text-white'
                  switch (qs?.status) {
                    case 'answered':
                      return 'bg-green-500 text-white'
                    case 'answered_and_marked':
                      return 'bg-purple-500 text-white'
                    case 'marked_for_review':
                      return 'bg-amber-400 text-white'
                    case 'visited_unanswered':
                      return 'bg-red-400 text-white'
                    default:
                      return 'bg-gray-200 text-gray-600'
                  }
                })()

                return (
                  <button
                    key={q.id}
                    onClick={() => engine.jumpToQuestion(section.id, idx)}
                    className={`w-9 h-9 rounded text-xs font-semibold transition-all hover:opacity-80 ${bgColor} ${
                      isActive ? 'ring-2 ring-[#1E3A5F] ring-offset-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <div className="grid grid-cols-2 gap-2 text-center mb-3">
          {[
            { val: answered, label: 'Answered', cls: 'text-green-600' },
            { val: notAnswered, label: 'Not Answered', cls: 'text-red-500' },
            { val: marked, label: 'Marked', cls: 'text-amber-500' },
            { val: notVisited, label: 'Not Visited', cls: 'text-gray-400' },
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
          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
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
    <footer className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between shrink-0">
      <button
        onClick={engine.previous}
        disabled={engine.state.activeQuestionIndex === 0}
        className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={engine.markForReview}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border transition-colors ${
            engine.activeQuestionState.isMarkedForReview
              ? 'bg-amber-50 border-amber-400 text-amber-700'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Mark for Review & Next
        </button>

        <button
          onClick={engine.clearResponse}
          disabled={engine.activeQuestionState.selectedOption === null}
          className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-4 h-4" />
          Clear Response
        </button>
      </div>

      <button
        onClick={engine.saveAndNext}
        className="flex items-center gap-1.5 px-5 py-2 text-sm bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-white font-semibold rounded-lg transition-colors"
      >
        Save & Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </footer>
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
  const engine = useExamEngine(config)

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
        <QuestionArea engine={engine} />
        <PaletteSidebar engine={engine} config={config} />
      </main>
      <ExamFooter engine={engine} />
    </div>
  )
}

// ─── Page (default export) ────────────────────────────────────────────────────

export default function ExamPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const config = getExamConfig(params.id)

  useEffect(() => {
    if (!config) router.replace('/assessments')
  }, [config, router])

  if (!config) return null

  return <ExamPlayer config={config} assessmentId={params.id} />
}
