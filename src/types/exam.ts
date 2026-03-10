export type ExamType = 'flexible_linear' | 'adaptive_sat'

export type QuestionStatus =
  | 'not_visited'
  | 'visited_unanswered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_and_marked'

export interface Option {
  id: 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface Question {
  id: string
  sectionId: string
  index: number              // 0-based within section
  type: 'single_correct' | 'passage_based' | 'mcq_multi' | 'numeric'
  passage?: string           // present if type === 'passage_based'
  text: string
  options: Option[]
  correctOption?: 'A' | 'B' | 'C' | 'D'   // single_correct / passage_based
  correctAnswers?: string[]                 // mcq_multi
  correctAnswer?: number                    // numeric
  explanation?: string
  marks?: number
  negativeMarks?: number
}

export interface Section {
  id: string
  label: string              // e.g. "English Language", "Physics"
  questionCount: number
  questions: Question[]
}

export interface ExamConfig {
  id: string                 // slug e.g. 'clat-full-test-1'
  title: string
  examType: ExamType
  totalDurationMinutes: number
  sections: Section[]
  navigationPolicy: 'free' | 'strict_sequential'
  markingScheme: {
    correct: number
    incorrect: number        // negative value e.g. -0.25
    unanswered: number       // always 0
  }
}

export interface QuestionState {
  questionId: string
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  selectedOptions?: string[]   // mcq_multi
  numericAnswer?: string       // numeric
  isMarkedForReview: boolean
  status: QuestionStatus
}

export interface ExamAttemptState {
  examId: string
  startedAt: number          // Date.now()
  questionStates: Record<string, QuestionState>  // key = questionId
  activeSectionId: string
  activeQuestionIndex: number
  isSubmitted: boolean
  timeRemainingSeconds: number
}
