'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Info, ArrowRight, ChevronLeft } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'
import clatFullTest1 from '@/data/exams/clat-full-test-1'
import neetFullTest1 from '@/data/exams/neet-full-test-1'
import type { ExamConfig } from '@/types/exam'

const examConfigRegistry: Record<string, ExamConfig> = {
  'clat-full-test-1': clatFullTest1,
  'neet-full-test-1': neetFullTest1,
}

const INSTRUCTIONS = [
  'This exam is conducted in online mode only. Ensure a stable internet connection throughout.',
  'Do not switch browser tabs or windows during the exam. Tab switching may result in disqualification.',
  'The exam will auto-submit when the timer reaches 00:00:00.',
  'Use the Question Palette on the right to track your progress across all sections.',
  'Navigation between questions and sections is subject to the specific rules of this assessment.',
  'Mark for Review allows you to flag a question — marked questions are still counted if answered.',
  'A basic arithmetic calculator is available via the button at the bottom right corner of the screen.',
  'Do not refresh the browser page during the exam. Your progress is saved automatically.',
  'Physical calculators, mobile phones, and electronic devices are not permitted.',
  'Read each question carefully. There is no option to retrieve your responses after submission.',
]

export default function ExamInstructionsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)

  const config = examConfigRegistry[params.id]

  if (!config) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Exam not found.</p>
      </div>
    )
  }

  const totalQuestions = config.sections.reduce(
    (sum, s) => sum + s.questionCount,
    0
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      <PageWrapper>
        <div className="max-w-3xl mx-auto flex flex-col gap-6 py-2">

          {/* Exam Identity Card */}
          <div className="bg-white rounded-md border border-zinc-200 shadow-sm p-6">
            <h1 className="text-xl font-bold text-blue-700">{config.title}</h1>
            <div className="flex flex-wrap gap-4 mt-1 text-sm text-zinc-500">
              <span>{totalQuestions} Questions</span>
              <span>{config.totalDurationMinutes} minutes</span>
              <span>
                +{config.markingScheme.correct} / {config.markingScheme.incorrect} per question
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {config.sections.map(section => (
                <span
                  key={section.id}
                  className="bg-zinc-100 text-gray-600 text-xs px-3 py-1 rounded-full"
                >
                  {section.label} ({section.questionCount})
                </span>
              ))}
            </div>
          </div>

          {/* General Instructions Card */}
          <div className="bg-white rounded-md border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-bold text-blue-700">General Instructions</h2>
            </div>
            <ol className="text-sm text-zinc-700 leading-relaxed space-y-3 list-decimal list-inside">
              {INSTRUCTIONS.map((instruction, i) => (
                <li key={i}>{instruction}</li>
              ))}
            </ol>
          </div>

          {/* Confirmation + Start Card */}
          <div className="bg-white rounded-md border border-zinc-200 shadow-sm p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-blue-700"
              />
              <span className="text-sm text-zinc-700">
                I have read and understood all the instructions and agree to the examination
                rules. I understand that any violation of rules may lead to disqualification.
              </span>
            </label>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => router.push(`/assessments/${params.id}`)}
                className="flex items-center gap-1 border border-zinc-300 text-zinc-700 bg-white rounded-md px-6 py-2.5 font-medium text-sm hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                disabled={!agreed}
                onClick={() => router.push(`/assessments/${params.id}/exam`)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  agreed
                    ? 'bg-blue-700 text-white hover:bg-blue-800'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Start Exam
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </PageWrapper>
    </div>
  )
}
