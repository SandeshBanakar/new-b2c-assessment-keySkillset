'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  Target,
  ChevronLeft,
  BarChart2,
} from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import { computeScore } from '@/utils/examScoring'
import { mockAttempts } from '@/data/assessments'
import clatFullTest1 from '@/data/exams/clat-full-test-1'
import neetFullTest1 from '@/data/exams/neet-full-test-1'
import type { ExamConfig, ExamAttemptState } from '@/types/exam'

// ─── Config Registry ─────────────────────────────────────────────────────────

const examConfigRegistry: Record<string, ExamConfig> = {
  'clat-full-test-1': clatFullTest1,
  'neet-full-test-1': neetFullTest1,
}

function getExamConfig(id: string): ExamConfig | null {
  return examConfigRegistry[id] ?? null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const config = getExamConfig(params.id)

  // Read localStorage synchronously via lazy initializer — avoids setState-in-effect
  const [data] = useState<{ attempt: ExamAttemptState | null; redirect: string | null }>(() => {
    if (typeof window === 'undefined') return { attempt: null, redirect: '/assessments' }
    if (!config) return { attempt: null, redirect: '/assessments' }

    try {
      const raw = localStorage.getItem(`exam_attempt_${params.id}`)
      if (!raw) return { attempt: null, redirect: `/assessments/${params.id}/instructions` }

      const parsed: ExamAttemptState = JSON.parse(raw)
      if (!parsed.isSubmitted) {
        return { attempt: null, redirect: `/assessments/${params.id}/instructions` }
      }
      return { attempt: parsed, redirect: null }
    } catch {
      return { attempt: null, redirect: `/assessments/${params.id}/instructions` }
    }
  })

  // Redirect via effect — no setState here
  useEffect(() => {
    if (data.redirect) router.replace(data.redirect)
  }, [data.redirect, router])

  if (data.redirect || !data.attempt || !config) return null

  const attemptState = data.attempt

  const scores = computeScore(attemptState, config)
  const totalQuestions = config.sections.reduce((sum, s) => sum + s.questionCount, 0)
  const maxScore = totalQuestions * config.markingScheme.correct
  const accuracy = Math.round(
    (scores.correctCount / Math.max(scores.correctCount + scores.incorrectCount, 1)) * 100
  )

  const freeAttemptId = mockAttempts.find(
    a => a.assessmentId === params.id && a.attemptNumber === 0
  )?.id

  return (
    <div className="min-h-screen bg-zinc-50">
      <PageWrapper>

        {/* Score header card */}
        <div className="bg-white shadow-sm rounded-md p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold text-zinc-900">{scores.totalScore}</p>
              <p className="text-sm text-zinc-500 mt-1">
                out of {maxScore} maximum
              </p>
            </div>
            <div className="text-sm text-zinc-500 sm:text-right">
              <p>Exam completed</p>
              <p className="mt-0.5">
                {new Date(attemptState.startedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Performance stats row */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-md px-6 py-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              {
                icon: <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />,
                value: scores.correctCount,
                label: 'Correct',
                cls: 'text-emerald-600',
              },
              {
                icon: <XCircle className="w-5 h-5 text-rose-600 mx-auto" />,
                value: scores.incorrectCount,
                label: 'Incorrect',
                cls: 'text-rose-600',
              },
              {
                icon: <MinusCircle className="w-5 h-5 text-zinc-500 mx-auto" />,
                value: scores.unansweredCount,
                label: 'Unanswered',
                cls: 'text-zinc-500',
              },
              {
                icon: <Target className="w-5 h-5 text-blue-600 mx-auto" />,
                value: accuracy + '%',
                label: 'Accuracy',
                cls: 'text-blue-600',
              },
            ].map(({ icon, value, label, cls }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                {icon}
                <span className={`text-2xl font-semibold ${cls}`}>{value}</span>
                <span className="text-xs text-zinc-500 mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="bg-white shadow-sm rounded-md p-6 mb-4">
          <h2 className="text-base font-medium text-zinc-900 mb-4">Section Breakdown</h2>

          {config.sections.map(section => {
            const ss = scores.sectionScores[section.id]
            const pct = Math.round(
              (ss.correct / Math.max(ss.correct + ss.incorrect, 1)) * 100
            )

            return (
              <div
                key={section.id}
                className="border border-zinc-200 rounded-md p-4 mb-3 last:mb-0"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-zinc-700">{section.label}</p>
                  <p className="text-lg font-semibold text-zinc-900">
                    {ss.score > 0 ? '+' : ''}{ss.score}
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span className="text-emerald-600">✓ {ss.correct} correct</span>
                  <span className="text-rose-500">✗ {ss.incorrect} incorrect</span>
                  <span>{ss.unanswered} unanswered</span>
                </div>
                <div className="mt-2 h-1.5 bg-zinc-100 rounded-full">
                  <div
                    className="h-1.5 bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/assessments/${params.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-zinc-300 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Assessment
          </button>

          {freeAttemptId && (
            <button
              onClick={() =>
                router.push(`/assessments/${params.id}/analysis/${freeAttemptId}`)
              }
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#1E3A5F] text-white font-semibold rounded-lg hover:bg-[#16304f] transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              View Detailed Analysis
            </button>
          )}
        </div>

      </PageWrapper>
    </div>
  )
}
