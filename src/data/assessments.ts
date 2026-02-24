import type {
  ExplanationData,
  MockAttempt,
  MockQuestion,
  QuestionAttemptResult,
  SyllabusSection,
} from '@/types';

// -------------------------------------------------------
// Score ranges per exam (for OverviewTab stat card)
// -------------------------------------------------------

export const SCORE_RANGES: Record<string, string> = {
  SAT: '400 – 1600',
  JEE: '0 – 360',
  NEET: '-180 – 720',
  PMP: '0 – 100%',
};

// -------------------------------------------------------
// Mock attempts — SAT Full Test 1
// -------------------------------------------------------

export const mockAttempts: MockAttempt[] = [
  {
    id: 'attempt-sat-full-1-0',
    assessmentId: 'sat-full-1',
    attemptNumber: 0,
    status: 'completed',
    score: 920,
    scoreRw: 480,
    scoreMath: 440,
    durationMinutes: 120,
    correctCount: 68,
    incorrectCount: 30,
    startedAt: '2026-01-15T09:00:00Z',
    completedAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'attempt-sat-full-1-1',
    assessmentId: 'sat-full-1',
    attemptNumber: 1,
    status: 'completed',
    score: 820,
    scoreRw: 440,
    scoreMath: 380,
    durationMinutes: 130,
    correctCount: 58,
    incorrectCount: 40,
    startedAt: '2026-01-22T09:00:00Z',
    completedAt: '2026-01-22T11:10:00Z',
  },
  {
    id: 'attempt-sat-full-1-2',
    assessmentId: 'sat-full-1',
    attemptNumber: 2,
    status: 'in_progress',
    score: 0,
    durationMinutes: null,
    correctCount: 0,
    incorrectCount: 0,
    startedAt: '2026-02-10T10:00:00Z',
    completedAt: null,
  },
  {
    id: 'attempt-sat-full-1-3',
    assessmentId: 'sat-full-1',
    attemptNumber: 3,
    status: 'not_started',
    score: 0,
    durationMinutes: null,
    correctCount: 0,
    incorrectCount: 0,
    startedAt: null,
    completedAt: null,
  },
  {
    id: 'attempt-sat-full-1-4',
    assessmentId: 'sat-full-1',
    attemptNumber: 4,
    status: 'not_started',
    score: 0,
    durationMinutes: null,
    correctCount: 0,
    incorrectCount: 0,
    startedAt: null,
    completedAt: null,
  },
  {
    id: 'attempt-sat-full-1-5',
    assessmentId: 'sat-full-1',
    attemptNumber: 5,
    status: 'not_started',
    score: 0,
    durationMinutes: null,
    correctCount: 0,
    incorrectCount: 0,
    startedAt: null,
    completedAt: null,
  },
];

// -------------------------------------------------------
// Mock question attempt results for attempt 0 (completed)
// -------------------------------------------------------

export const mockQuestionResults: QuestionAttemptResult[] = [
  {
    questionId: 'q-sat-1',
    questionNumber: 1,
    userAnswer: 'B',
    isCorrect: false,
    timeSpentSeconds: 72,
    module: 'RW-M1',
  },
  {
    questionId: 'q-sat-2',
    questionNumber: 2,
    userAnswer: 'A',
    isCorrect: true,
    timeSpentSeconds: 95,
    module: 'Math-M1',
  },
  {
    questionId: 'q-sat-3',
    questionNumber: 3,
    userAnswer: '5',
    isCorrect: true,
    timeSpentSeconds: 45,
    module: 'Math-M1',
  },
  {
    questionId: 'q-sat-4',
    questionNumber: 4,
    userAnswer: null,
    isCorrect: false,
    timeSpentSeconds: 30,
    module: 'RW-M1',
  },
];

// -------------------------------------------------------
// Mock questions — 4 types for demo
// -------------------------------------------------------

const passageQ1Explanation: ExplanationData = {
  correctAnswerLabel: 'The correct answer is C.',
  optionBreakdowns: [
    {
      option: 'A',
      text: 'Incorrect. The text does not primarily argue for government policy changes; it describes a scientific phenomenon and its ecological consequences.',
    },
    {
      option: 'B',
      text: 'Incorrect. While the text mentions economic impacts, the main purpose is broader — it addresses the ecological and climate consequences of deforestation.',
    },
    {
      option: 'C',
      text: 'Correct. The passage surveys the multiple environmental consequences of tropical deforestation, including biodiversity loss, carbon release, and disruption of water cycles.',
    },
    {
      option: 'D',
      text: 'Incorrect. The text does not propose solutions or conservation strategies; it describes the problem and its effects.',
    },
  ],
};

const mathQ2Explanation: ExplanationData = {
  correctAnswerLabel: 'The correct answer is A: x\u207b\u00b9\u00b2y\u00b9\u2076.',
  steps: [
    'Apply the Quotient Rule inside the parentheses: x\u2074/x\u207b\u00b2 = x\u2074\u207b(\u207b\u00b2) = x\u2076, and y\u00b3/y\u207b\u2075 = y\u00b3\u207b(\u207b\u2075) = y\u2078. Expression becomes (x\u2076y\u2078)\u207b\u00b2.',
    'Apply the Power Rule: multiply each exponent by \u22122. x\u2076 \u00d7 (\u22122) = x\u207b\u00b9\u00b2, and y\u2078 \u00d7 (\u22122) = y\u207b\u00b9\u2076.',
    'Final answer: x\u207b\u00b9\u00b2y\u207b\u00b9\u2076 — which matches option A.',
  ],
};

const numericQ3Explanation: ExplanationData = {
  correctAnswerLabel: 'The correct answer is 5.',
  steps: [
    'Start with the equation: 3x + 7 = 22.',
    'Subtract 7 from both sides: 3x = 22 \u2212 7 = 15.',
    'Divide both sides by 3: x = 15 / 3 = 5.',
  ],
};

const multipleQ4Explanation: ExplanationData = {
  correctAnswerLabel: 'The correct answers are A and C.',
  optionBreakdowns: [
    {
      option: 'A',
      text: 'Correct. This choice directly cites the study\u2019s quantitative findings, providing specific evidence that supports the central claim about deforestation rates.',
    },
    {
      option: 'B',
      text: 'Incorrect. This option introduces a counterargument without connecting it to the central claim, weakening rather than supporting the argument.',
    },
    {
      option: 'C',
      text: 'Correct. This choice references expert consensus and peer-reviewed data, effectively strengthening the central claim with credible evidence.',
    },
    {
      option: 'D',
      text: 'Incorrect. This choice offers a personal anecdote, which lacks the evidentiary weight needed to support a scientific central claim.',
    },
  ],
};

export const mockQuestions: MockQuestion[] = [
  // Q1 — PassageSingle (Reading comprehension)
  {
    id: 'q-sat-1',
    assessmentId: 'sat-full-1',
    questionNumber: 1,
    type: 'passage-single',
    passageText:
      'The rapid deforestation of tropical rainforests represents one of the most consequential environmental transformations of the modern era. Between 1990 and 2020, the world lost approximately 420 million hectares of forest — an area larger than the European Union. Tropical forests, which cover only 7% of the Earth\'s land surface, harbour more than half of the world\'s plant and animal species. When these ecosystems are cleared for agriculture or timber, the immediate consequences include catastrophic biodiversity loss and the release of vast quantities of stored carbon dioxide into the atmosphere. Less visible but equally significant is the disruption of regional water cycles: tropical forests generate rainfall through transpiration, and their removal can trigger severe droughts in areas hundreds of kilometres away. Scientists studying the Amazon Basin have found that continued deforestation could push the biome past a tipping point beyond which large-scale forest regeneration becomes impossible.',
    questionText: 'Which choice best states the main purpose of the text?',
    options: [
      'A. To argue that international governments must enact stricter environmental legislation to protect tropical forests',
      'B. To highlight the economic consequences of deforestation for communities that depend on forest resources',
      'C. To survey the wide-ranging environmental consequences of tropical deforestation, from biodiversity loss to climate disruption',
      'D. To propose conservation strategies that could reverse the damage caused by decades of deforestation',
    ],
    correctAnswer: 'C',
    explanation: passageQ1Explanation,
    conceptTag: 'Information and Ideas',
    module: 'RW-M1',
  },

  // Q2 — MCQSingle (Math with superscript)
  {
    id: 'q-sat-2',
    assessmentId: 'sat-full-1',
    questionNumber: 2,
    type: 'mcq-single',
    questionText:
      'Simplify: (x<sup>4</sup>y<sup>3</sup> / x<sup>-2</sup>y<sup>-5</sup>)<sup>-2</sup>',
    options: [
      'A. x<sup>-12</sup>y<sup>-16</sup>',
      'B. x<sup>12</sup>y<sup>-16</sup>',
      'C. x<sup>-8</sup>y<sup>16</sup>',
      'D. x<sup>8</sup>y<sup>-16</sup>',
    ],
    correctAnswer: 'A',
    explanation: mathQ2Explanation,
    conceptTag: 'Advanced Math',
    module: 'Math-M1',
  },

  // Q3 — Numeric (Algebra)
  {
    id: 'q-sat-3',
    assessmentId: 'sat-full-1',
    questionNumber: 3,
    type: 'numeric',
    questionText: 'If 3x + 7 = 22, what is the value of x?',
    correctAnswer: '5',
    explanation: numericQ3Explanation,
    conceptTag: 'Algebra',
    module: 'Math-M1',
  },

  // Q4 — MCQMultiple (English)
  {
    id: 'q-sat-4',
    assessmentId: 'sat-full-1',
    questionNumber: 4,
    type: 'mcq-multiple',
    questionText:
      'Which TWO choices most effectively use evidence to support the central claim that tropical deforestation poses an existential threat to global biodiversity?',
    options: [
      'A. "Tropical forests harbour more than half of the world\'s plant and animal species, and their destruction eliminates irreplaceable genetic diversity."',
      'B. "Some economists argue that the short-term agricultural gains from deforestation outweigh the ecological costs for developing nations."',
      'C. "Studies show that species extinction rates in cleared forest zones are up to 1,000 times higher than natural background rates."',
      'D. "A local farmer in the Amazon described how clearing land transformed his family\'s economic prospects within a single generation."',
    ],
    correctAnswer: 'A',
    correctAnswers: ['A', 'C'],
    explanation: multipleQ4Explanation,
    conceptTag: 'Expression of Ideas',
    module: 'RW-M1',
  },
];

// -------------------------------------------------------
// Syllabus — SAT Full Test 1
// -------------------------------------------------------

export const mockSyllabus: SyllabusSection[] = [
  {
    number: 1,
    title: 'Reading & Writing',
    topics: [
      'Information and Ideas — Central Ideas, Details, Command of Evidence',
      'Craft and Structure — Words in Context, Text Structure and Purpose, Cross-text Connections',
      'Expression of Ideas — Rhetorical Synthesis, Transitions',
      'Standard English Conventions — Boundaries, Form, Structure, and Sense',
    ],
  },
  {
    number: 2,
    title: 'Math',
    topics: [
      'Algebra — Linear equations, linear inequalities, systems of equations',
      'Advanced Math — Equivalent expressions, nonlinear equations, nonlinear functions',
      'Problem-Solving & Data Analysis — Ratios, rates, proportions, percentages, statistics',
      'Geometry & Trigonometry — Area, volume, lines, angles, triangles, trigonometry',
    ],
  },
];
