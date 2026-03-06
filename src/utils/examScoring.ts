import type { ExamAttemptState, ExamConfig } from '@/types/exam'

export function computeScore(
  state: ExamAttemptState,
  config: ExamConfig
): {
  totalScore: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  sectionScores: Record<
    string,
    { score: number; correct: number; incorrect: number; unanswered: number }
  >
} {
  let correct = 0, incorrect = 0, unanswered = 0
  const sectionScores: Record<
    string,
    { score: number; correct: number; incorrect: number; unanswered: number }
  > = {}

  config.sections.forEach(section => {
    let sCorrect = 0, sIncorrect = 0, sUnanswered = 0

    section.questions.forEach(q => {
      const qs = state.questionStates[q.id]
      if (!qs || qs.selectedOption === null) {
        unanswered++; sUnanswered++
      } else if (qs.selectedOption === q.correctOption) {
        correct++; sCorrect++
      } else {
        incorrect++; sIncorrect++
      }
    })

    const { correct: c, incorrect: inc, unanswered: u } = config.markingScheme
    sectionScores[section.id] = {
      score: sCorrect * c + sIncorrect * inc + sUnanswered * u,
      correct: sCorrect,
      incorrect: sIncorrect,
      unanswered: sUnanswered,
    }
  })

  const { correct: c, incorrect: inc, unanswered: u } = config.markingScheme
  const totalScore = correct * c + incorrect * inc + unanswered * u

  return {
    totalScore,
    correctCount: correct,
    incorrectCount: incorrect,
    unansweredCount: unanswered,
    sectionScores,
  }
}
