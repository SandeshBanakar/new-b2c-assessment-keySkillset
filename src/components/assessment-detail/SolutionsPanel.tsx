'use client';

import { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DbQuestion {
  id: string;
  question_type: string;
  module_name: string | null;
  question_order: number | null;
  question_text: unknown;
  passage_text: unknown;
  options: unknown;
  correct_answer: unknown;
  explanation: unknown;
  concept_tag: string | null;
}

export interface UserAnswer {
  question_id: string;
  user_answer: string | null;
  is_correct: boolean | null;
  is_skipped: boolean | null;
}

const PAGE_SIZE = 25;

const MODULE_LABELS: Record<string, string> = {
  rw_module_1: 'R&W Module 1',
  rw_module_2: 'R&W Module 2',
  math_module_1: 'Math Module 1',
  math_module_2: 'Math Module 2',
};

const MODULE_ORDER = ['rw_module_1', 'rw_module_2', 'math_module_1', 'math_module_2'];

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ_SINGLE: 'MCQ',
  MCQ_MULTI: 'MCQ Multi',
  PASSAGE_SINGLE: 'Passage',
  PASSAGE_MULTI: 'Passage Multi',
  NUMERIC: 'Numeric',
};

function extractText(jsonb: unknown): string {
  if (!jsonb) return '';
  if (typeof jsonb === 'string') return jsonb;
  try {
    const doc = jsonb as { content?: { content?: { text?: string }[] }[] };
    return (
      doc.content
        ?.flatMap((block) => block.content ?? [])
        .map((n) => n.text ?? '')
        .join('') ?? ''
    );
  } catch {
    return '';
  }
}

function extractOptions(jsonb: unknown): { key: string; text: string }[] {
  if (!jsonb) return [];
  try {
    const arr = jsonb as { key: string; text: unknown }[];
    return arr.map((o) => ({ key: o.key, text: extractText(o.text) }));
  } catch {
    return [];
  }
}

function extractCorrectAnswer(jsonb: unknown): string[] {
  if (!jsonb) return [];
  try {
    if (Array.isArray(jsonb)) return jsonb.map(String);
    return [String(jsonb)];
  } catch {
    return [];
  }
}

function QuestionCard({
  question,
  questionNumber,
  userAnswer,
}: {
  question: DbQuestion;
  questionNumber: number;
  userAnswer?: UserAnswer;
}) {
  const questionText = extractText(question.question_text);
  const passageText  = extractText(question.passage_text);
  const options      = extractOptions(question.options);
  const correctKeys  = extractCorrectAnswer(question.correct_answer);
  const explanationText = extractText(question.explanation);
  const typeLabel    = QUESTION_TYPE_LABELS[question.question_type] ?? question.question_type;

  const userKey     = userAnswer?.user_answer ?? null;
  const isSkipped   = userAnswer?.is_skipped ?? false;
  const isCorrect   = userAnswer?.is_correct ?? null;

  return (
    <div className="border border-zinc-100 rounded-md p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Question {questionNumber}</p>
          {question.concept_tag && (
            <p className="text-xs text-zinc-500 mt-0.5">{typeLabel} · {question.concept_tag}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isSkipped && (
            <span className="text-xs font-medium bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5">
              Skipped
            </span>
          )}
          {!isSkipped && isCorrect !== null && (
            <span
              className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                isCorrect
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          )}
          <span className="text-xs font-medium bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5">
            {typeLabel}
          </span>
        </div>
      </div>

      {passageText && (
        <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4 mb-4 text-sm text-zinc-700">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Passage</p>
          <p className="leading-relaxed">{passageText}</p>
        </div>
      )}

      {questionText && (
        <div className="mb-4">
          <p className="text-sm text-zinc-800 font-medium mb-2">Question</p>
          <p className="text-sm text-zinc-700 leading-relaxed">{questionText}</p>
        </div>
      )}

      {question.question_type === 'NUMERIC' ? (
        <div className="mb-4">
          <p className="text-xs font-medium text-zinc-500 mb-1">Answer type: Numeric</p>
          {correctKeys.length > 0 && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 inline-block">
              Correct answer: {correctKeys.join(', ')}
            </div>
          )}
          {userKey && !isSkipped && (
            <p className="text-xs text-zinc-500 mt-1">Your answer: {userKey}</p>
          )}
        </div>
      ) : (
        options.length > 0 && (
          <div className="space-y-2 mb-4">
            {options.map((opt) => {
              const isCorrectOpt = correctKeys.includes(opt.key);
              const isUserOpt    = userKey === opt.key;
              let cls = 'bg-white border-zinc-200 text-zinc-700';
              if (isCorrectOpt) cls = 'bg-emerald-50 border-emerald-200 text-emerald-700';
              else if (isUserOpt && !isCorrect) cls = 'bg-rose-50 border-rose-200 text-rose-700';
              return (
                <div key={opt.key} className={`rounded-md border px-3 py-2 text-sm ${cls}`}>
                  <span className="font-medium mr-2">{opt.key}.</span>
                  {opt.text}
                  {isCorrectOpt && (
                    <span className="ml-2 text-xs font-medium text-emerald-600">(Correct)</span>
                  )}
                  {isUserOpt && !isCorrectOpt && (
                    <span className="ml-2 text-xs font-medium text-rose-600">(Your answer)</span>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {explanationText && (
        <div className="rounded-md bg-blue-50 border border-blue-100 p-4 text-sm text-zinc-700">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Explanation</p>
          <p className="leading-relaxed">{explanationText}</p>
        </div>
      )}
    </div>
  );
}

export default function SolutionsPanel({
  questions,
  userAnswers = [],
  isFullTest = false,
}: {
  questions: DbQuestion[];
  userAnswers?: UserAnswer[];
  isFullTest?: boolean;
}) {
  const answerMap = Object.fromEntries(userAnswers.map((a) => [a.question_id, a]));

  const moduleOrder = isFullTest
    ? MODULE_ORDER
    : ['math_module_1', 'rw_module_1', 'math_module_2', 'rw_module_2', null as unknown as string];

  const groupedByModule = moduleOrder.reduce<Record<string, DbQuestion[]>>((acc, mod) => {
    const qs = questions.filter((q) => q.module_name === mod || (!mod && !q.module_name));
    if (qs.length) acc[mod ?? '__none__'] = qs;
    return acc;
  }, {});

  const availableModules = moduleOrder.filter(
    (m) => groupedByModule[m ?? '__none__']?.length,
  );

  const fallbackModule = availableModules[0] ?? null;

  const [activeModule, setActiveModule] = useState<string | null>(fallbackModule);
  const [page, setPage] = useState(0);

  if (questions.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-medium text-zinc-900">Solutions</h3>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 text-center">
          No questions available for this assessment.
        </div>
      </div>
    );
  }

  const moduleKey    = activeModule ?? '__none__';
  const moduleQs     = groupedByModule[moduleKey] ?? [];
  const totalPages   = Math.ceil(moduleQs.length / PAGE_SIZE);
  const pageQs       = moduleQs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageOffset   = page * PAGE_SIZE;

  function handleModuleChange(mod: string) {
    setActiveModule(mod);
    setPage(0);
  }

  return (
    <div className="bg-white shadow-sm rounded-md p-6">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-4 h-4 text-blue-600" />
        <h3 className="text-base font-medium text-zinc-900">Solutions</h3>
        <span className="ml-auto text-xs text-zinc-400">{questions.length} questions</span>
      </div>

      {availableModules.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-zinc-100">
          {availableModules.map((mod) => {
            const key   = mod ?? '__none__';
            const label = MODULE_LABELS[mod] ?? 'Questions';
            const count = groupedByModule[key]?.length ?? 0;
            const isActive = activeModule === mod;
            return (
              <button
                key={key}
                onClick={() => handleModuleChange(mod)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-zinc-200 text-zinc-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-5">
        {pageQs.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            questionNumber={pageOffset + idx + 1}
            userAnswer={answerMap[q.id]}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-zinc-600 border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs text-zinc-500">
            Page {page + 1} of {totalPages} · questions {pageOffset + 1}–{Math.min(pageOffset + PAGE_SIZE, moduleQs.length)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-zinc-600 border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
