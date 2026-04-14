'use client';

import { BookOpen } from 'lucide-react';

export type SolutionQuestionType =
  | 'mcq-single'
  | 'mcq-multiple'
  | 'passage-single'
  | 'passage-multi';

export interface DemoSolution {
  id: string;
  type: SolutionQuestionType;
  questionNumber: string;
  passageText?: string;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  explanation?: string;
  conceptTag: string;
  subQuestions?: {
    questionText: string;
    options: string[];
    correctAnswers: string[];
    explanation: string;
  }[];
}

export const QUESTION_TYPE_LABELS: Record<SolutionQuestionType, string> = {
  'mcq-single': 'MCQ Single',
  'mcq-multiple': 'MCQ Multiple',
  'passage-single': 'Passage Single',
  'passage-multi': 'Passage Multiple',
};

export const SOLUTION_QUESTIONS: DemoSolution[] = [
  {
    id: 'demo-q-1',
    type: 'mcq-single',
    questionNumber: '1',
    questionText:
      'A 2 kg block slides without friction on an incline. If the acceleration is 6 m/s² and g = 9.8 m/s², what is the angle of the incline?',
    options: ['A. 20°', 'B. 40°', 'C. 30°', 'D. 50°'],
    correctAnswer: 'B',
    explanation:
      'For a frictionless incline, acceleration = g · sinθ. So sinθ = 6 / 9.8 ≈ 0.61, which corresponds to about 40°. This is a common NEET-style mechanics calculation.',
    conceptTag: 'Dynamics',
  },
  {
    id: 'demo-q-2',
    type: 'mcq-multiple',
    questionNumber: '2',
    questionText:
      'Which TWO statements about DNA replication are correct in the context of cellular division?',
    options: [
      'A. DNA strands are antiparallel during replication.',
      'B. Replication can begin only after transcription has finished.',
      'C. Okazaki fragments form on the lagging strand.',
      'D. The ribosome directly synthesizes the new DNA strand.',
    ],
    correctAnswers: ['A', 'C'],
    explanation:
      'DNA replication requires antiparallel strands and synthesis of Okazaki fragments on the lagging strand. Transcription is a separate process, and ribosomes do not make DNA.',
    conceptTag: 'Molecular Biology',
  },
  {
    id: 'demo-q-3',
    type: 'passage-single',
    questionNumber: '3',
    passageText:
      'The Supreme Court’s recent ruling clarified that administrative discretion must always be exercised within the bounds of reasonableness. The judgment emphasized that decisions taken by public authorities are subject to judicial review if they are arbitrary, irrational, or manifestly unreasonable. The court also observed that procedural fairness remains a constitutional guarantee even when decisions are made in high-pressure policy settings.',
    questionText:
      'What is the main conclusion the passage draws about administrative decisions?',
    options: [
      'A. They should never be reviewed by courts.',
      'B. They are constitutional only when made quickly.',
      'C. They must be reasonable and fair to survive judicial review.',
      'D. They should be made solely by elected officials.',
    ],
    correctAnswer: 'C',
    explanation:
      'The passage explains that administrative decisions are valid only if they are reasonable, non-arbitrary, and procedurally fair, which is the standard for judicial review.',
    conceptTag: 'Legal Reasoning',
  },
  {
    id: 'demo-q-4',
    type: 'passage-multi',
    questionNumber: '4',
    passageText:
      'A biotech company developed a new enzyme that speeds up a metabolic reaction by lowering the activation energy. During testing, researchers found that the enzyme binds to the substrate at a specific active site, undergoes a conformational change, and then releases the product unchanged. The rate of reaction increased significantly at 37°C, but the enzyme became less effective above 45°C.',
    conceptTag: 'Enzymes and Metabolism',
    subQuestions: [
      {
        questionText:
          'Which statement best describes the enzyme’s role in the reaction?',
        options: [
          'A. It changes the equilibrium constant of the reaction.',
          'B. It increases the reaction rate by lowering activation energy.',
          'C. It provides thermal energy to the substrate.',
          'D. It becomes permanently altered during catalysis.',
        ],
        correctAnswers: ['B'],
        explanation:
          'Enzymes accelerate reactions by reducing activation energy without changing the equilibrium or being consumed, which matches the passage description.',
      },
      {
        questionText:
          'Which TWO conditions are most likely to reduce the enzyme’s activity?',
        options: [
          'A. Increasing temperature from 37°C to 42°C',
          'B. Raising the temperature above 45°C',
          'C. Removing the substrate from the active site',
          'D. Adding more substrate while the active site is already saturated',
        ],
        correctAnswers: ['B', 'C'],
        explanation:
          'Enzyme activity drops when the protein denatures above 45°C or when substrate is unavailable, making B and C the correct choices.',
      },
    ],
  },
];

export const SAT_SOLUTION_QUESTIONS: DemoSolution[] = [
  {
    id: 'sat-q-1',
    type: 'mcq-single',
    questionNumber: '1',
    questionText:
      'If f(x) = 3x^2 - 2x + 1, what is f(2)?',
    options: ['A. 7', 'B. 9', 'C. 11', 'D. 13'],
    correctAnswer: 'B',
    explanation:
      'Evaluate the quadratic at x = 2: 3(4) - 2(2) + 1 = 12 - 4 + 1 = 9. The correct answer is B.',
    conceptTag: 'Quadratic equations',
  },
  {
    id: 'sat-q-2',
    type: 'mcq-multiple',
    questionNumber: '2',
    questionText:
      'Which TWO statements about the equation 2x + 3 = 7 are true?',
    options: [
      'A. The solution is x = 2.',
      'B. The graph is a line with slope 2.',
      'C. It has two solutions because it is a quadratic.',
      'D. It represents a linear function.',
    ],
    correctAnswers: ['A', 'D'],
    explanation:
      '2x + 3 = 7 is a linear equation with slope 2 and a single solution x = 2. It is not quadratic and does not have two solutions.',
    conceptTag: 'Linear functions',
  },
  {
    id: 'sat-q-3',
    type: 'passage-single',
    questionNumber: '3',
    passageText:
      'The author argues that the best way to prepare for the SAT Writing section is to read widely and practice editing real sentences. By working with passages written by experienced journalists, students learn to spot errors in grammar, usage, and style. Preparation also includes learning how to choose the most precise language and understand the writer’s purpose.',
    questionText:
      'According to the passage, what is most important for SAT Writing preparation?',
    options: [
      'A. Memorizing grammar rules without reading examples.',
      'B. Reading widely and editing real sentences.',
      'C. Practicing only multiple-choice vocabulary questions.',
      'D. Writing essays on unfamiliar topics.',
    ],
    correctAnswer: 'B',
    explanation:
      'The passage emphasizes reading widely and practicing editing real sentences as the best preparation strategy.',
    conceptTag: 'Reading comprehension',
  },
  {
    id: 'sat-q-4',
    type: 'passage-multi',
    questionNumber: '4',
    passageText:
      'A student newspaper article described a new campus shuttle service. The writer noted that the shuttle runs every 15 minutes, that it connects both dorms and academic buildings, and that riders can use existing student ID cards to board. The article also mentioned that the service will reduce travel time for students who previously relied on city buses.',
    conceptTag: 'Text structure and organization',
    subQuestions: [
      {
        questionText:
          'What is the main purpose of the article?',
        options: [
          'A. To criticize the campus shuttle service.',
          'B. To inform students about a new transportation option.',
          'C. To compare student ID cards with city bus tickets.',
          'D. To explain why the old bus service was better.',
        ],
        correctAnswers: ['B'],
        explanation:
          'The article is informing students about a new campus shuttle service and how it works.',
      },
      {
        questionText:
          'Which detail best supports the writer’s point that the service is convenient?',
        options: [
          'A. It runs every 15 minutes.',
          'B. It will reduce travel time for students.',
          'C. Riders can use student ID cards to board.',
          'D. It connects dorms and academic buildings.',
        ],
        correctAnswers: ['C', 'D'],
        explanation:
          'Using student ID cards and connecting dorms with academic buildings are both concrete conveniences mentioned in the passage.',
      },
    ],
  },
];

export default function SolutionsPanel({
  solutions,
}: {
  solutions: DemoSolution[];
}) {
  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-medium text-zinc-900">Solutions panel</h3>
      </div>

      {solutions.length === 0 ? (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
          No solution items match this filter.
        </div>
      ) : (
        <div className="space-y-5">
          {solutions.map((item) => (
            <div key={item.id} className="border border-zinc-100 rounded-md p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Question {item.questionNumber}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {QUESTION_TYPE_LABELS[item.type]} • {item.conceptTag}
                  </p>
                </div>
                <span className="text-xs font-medium bg-zinc-100 text-zinc-700 rounded-full px-2 py-1">
                  {QUESTION_TYPE_LABELS[item.type]}
                </span>
              </div>

              {item.passageText && (
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 mb-4 text-sm text-zinc-700">
                  <p className="font-medium text-zinc-800 mb-2">Passage</p>
                  <p>{item.passageText}</p>
                </div>
              )}

              {item.questionText && (
                <div className="mb-4">
                  <p className="text-sm text-zinc-800 font-medium mb-2">Question</p>
                  <p className="text-sm text-zinc-700 leading-relaxed">{item.questionText}</p>
                </div>
              )}

              {item.options && (
                <div className="space-y-2 mb-4">
                  {item.options.map((option) => {
                    const selectedCorrect =
                      item.correctAnswers?.includes(option.charAt(0)) ||
                      item.correctAnswer === option.charAt(0);
                    return (
                      <div
                        key={option}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          selectedCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-zinc-200 text-zinc-700'
                        }`}
                      >
                        {option}
                      </div>
                    );
                  })}
                </div>
              )}

              {item.explanation && (
                <div className="rounded-md bg-blue-50 border border-blue-100 p-4 text-sm text-zinc-700 mb-4">
                  <p className="font-medium text-blue-700 mb-2">Explanation</p>
                  <p>{item.explanation}</p>
                </div>
              )}

              {item.correctAnswer && item.options && (
                <p className="text-xs text-zinc-500 mt-2">
                  Correct answer: {item.correctAnswer}
                </p>
              )}
              {item.correctAnswers && !item.subQuestions?.length && (
                <p className="text-xs text-zinc-500 mt-2">
                  Correct answers: {item.correctAnswers.join(', ')}
                </p>
              )}

              {item.subQuestions?.length && (
                <div className="space-y-5 mt-4">
                  {item.subQuestions.map((sub, index) => (
                    <div key={index} className="rounded-md border border-zinc-200 p-4">
                      <p className="text-sm font-medium text-zinc-900 mb-2">
                        Sub-question {index + 1}
                      </p>
                      <p className="text-sm text-zinc-700 mb-3">{sub.questionText}</p>
                      <div className="space-y-2 mb-3">
                        {sub.options.map((option) => (
                          <div
                            key={option}
                            className={`rounded-md border px-3 py-2 text-sm ${
                              sub.correctAnswers.includes(option.charAt(0))
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-white border-zinc-200 text-zinc-700'
                            }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500 mb-3">
                        Correct answer{sub.correctAnswers.length > 1 ? 's' : ''}: {sub.correctAnswers.join(', ')}
                      </p>
                      <div className="rounded-md bg-blue-50 border border-blue-100 p-4 text-sm text-zinc-700">
                        <p className="font-medium text-blue-700 mb-2">Explanation</p>
                        <p>{sub.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
