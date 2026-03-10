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
    const correctOption = CORRECT_OPTIONS[i % 4]
    const topic = label.toLowerCase()

    questions.push({
      id: `${id}-q${n}`,
      sectionId: id,
      index: i,
      type: 'single_correct',
      text: `${label} Question ${n} — This is a sample single_correct question for NEET level examination.`,
      options: OPTIONS,
      correctOption,
      explanation: `The correct answer is ${correctOption} because this tests ${topic} comprehension at NEET level.`,
    })
  }

  return { id, label, questionCount, questions }
}

const physicsSection = buildSection('physics', 'Physics', 45)
physicsSection.questions.push(
  {
    id: 'neet-phy-multi-1',
    sectionId: 'physics',
    index: 45,
    type: 'mcq_multi',
    text: 'Which of the following are vector quantities? (Select all that apply)',
    options: [
      { id: 'A', text: 'Displacement' },
      { id: 'B', text: 'Speed' },
      { id: 'C', text: 'Velocity' },
      { id: 'D', text: 'Distance' },
    ],
    correctAnswers: ['A', 'C'],
    marks: 4,
    negativeMarks: -2,
  },
  {
    id: 'neet-phy-numeric-1',
    sectionId: 'physics',
    index: 46,
    type: 'numeric',
    text: 'A body travels 60 metres in the first 10 seconds and 40 metres in the next 5 seconds. What is the average speed (in m/s) for the entire journey?',
    options: [],
    correctAnswer: 6.67,
    marks: 4,
    negativeMarks: 0,
  }
)
physicsSection.questionCount = 47

const neetFullTest1: ExamConfig = {
  id: 'neet-full-test-1',
  title: 'NEET Full Mock Test 1',
  examType: 'flexible_linear',
  totalDurationMinutes: 200,
  navigationPolicy: 'free',
  markingScheme: { correct: 4, incorrect: -1, unanswered: 0 },
  sections: [
    physicsSection,
    buildSection('chemistry', 'Chemistry', 45),
    buildSection('biology', 'Biology', 90),
  ],
}

export default neetFullTest1
