import type { ExamConfig, Question, Section } from '@/types/exam'

const OPTIONS = [
  { id: 'A' as const, text: 'Option A' },
  { id: 'B' as const, text: 'Option B' },
  { id: 'C' as const, text: 'Option C' },
  { id: 'D' as const, text: 'Option D' },
]

const CORRECT_OPTIONS = ['A', 'B', 'C', 'D'] as const

function buildSection(
  id: string,
  label: string,
  questionCount: number
): Section {
  const questions: Question[] = []

  for (let i = 0; i < questionCount; i++) {
    const n = i + 1
    const isPassage = i < 4
    const correctOption = CORRECT_OPTIONS[i % 4]
    const topic = label.toLowerCase()

    questions.push({
      id: `${id}-q${n}`,
      sectionId: id,
      index: i,
      type: isPassage ? 'passage_based' : 'single_correct',
      ...(isPassage && {
        passage: `This is a reading passage for ${label} questions. It contains relevant information to answer the following set of questions accurately.`,
      }),
      text: isPassage
        ? `${label} Question ${n} — This is a sample passage_based question for CLAT level examination.`
        : `${label} Question ${n} — This is a sample single_correct question for CLAT level examination.`,
      options: OPTIONS,
      correctOption,
      explanation: `The correct answer is ${correctOption} because this tests ${topic} comprehension at CLAT level.`,
    })
  }

  return { id, label, questionCount, questions }
}

const clatFullTest1: ExamConfig = {
  id: 'clat-full-test-1',
  title: 'CLAT Full Mock Test 1',
  examType: 'flexible_linear',
  totalDurationMinutes: 120,
  navigationPolicy: 'free',
  markingScheme: { correct: 1, incorrect: -0.25, unanswered: 0 },
  sections: [
    buildSection('english-language', 'English Language', 28),
    buildSection('current-affairs', 'Current Affairs & GK', 28),
    buildSection('legal-reasoning', 'Legal Reasoning', 28),
    buildSection('logical-reasoning', 'Logical Reasoning', 28),
    buildSection('quantitative', 'Quantitative Techniques', 28),
  ],
}

export default clatFullTest1
