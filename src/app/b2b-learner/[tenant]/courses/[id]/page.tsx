'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BookOpen, Award, ArrowLeft, Clock, FileText, PlayCircle,
  CheckCircle2, Circle, ChevronDown, ChevronRight, BarChart2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';

const COURSE_TYPE_COLOR: Record<string, string> = {
  CLICK_BASED:       'bg-teal-100 text-teal-700',
  VIDEO:             'bg-indigo-100 text-indigo-700',
  CODING_SANDBOX:    'bg-violet-100 text-violet-700',
  COMBINATION:       'bg-blue-100 text-blue-700',
  KEYBOARD_TRAINER:  'bg-amber-100 text-amber-700',
};

interface Course {
  id: string;
  title: string;
  description: string | null;
  course_type: string;
  status: string;
  category: string | null;
}

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

interface CourseTopic {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
}

interface LearnerProgress {
  progress_pct: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} className="fill-none stroke-zinc-100" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r}
        className="fill-none stroke-teal-600 transition-all duration-700"
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActionPanel({
  course,
  progress,
  certificate,
  totalTopics,
  totalModules,
}: {
  course: Course;
  progress: LearnerProgress | null;
  certificate: Certificate | null;
  totalTopics: number;
  totalModules: number;
}) {
  const pct = progress?.progress_pct ?? 0;
  const isCompleted = progress?.status === 'COMPLETED';
  const isStarted = !!progress?.started_at;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-5 shadow-sm">
      {/* Progress ring + stats */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <ProgressRing pct={pct} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-zinc-900">
            {pct}%
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-900">
            {isCompleted ? 'Course Completed' : isStarted ? 'In Progress' : 'Not Started'}
          </p>
          <p className="text-xs text-zinc-500">{totalModules} modules · {totalTopics} topics</p>
          {progress?.started_at && (
            <p className="text-xs text-zinc-400">
              Started {new Date(progress.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      </div>

      <div className="w-full bg-zinc-100 rounded-full h-1.5">
        <div
          className="bg-teal-600 h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* CTA */}
      {isCompleted ? (
        <button className="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
          <Award className="w-4 h-4" />
          View Certificate
        </button>
      ) : (
        <button className="w-full px-4 py-2.5 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 transition-colors flex items-center justify-center gap-2">
          <PlayCircle className="w-4 h-4" />
          {isStarted ? 'Continue Course' : 'Start Course'}
        </button>
      )}

      {/* Certificate info */}
      {certificate && (
        <div className="pt-3 border-t border-zinc-100">
          <div className="flex items-start gap-2">
            <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-zinc-700">Certificate Earned</p>
              <p className="text-xs text-zinc-400 font-mono">{certificate.certificate_number}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {new Date(certificate.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Course meta */}
      <div className="pt-3 border-t border-zinc-100 space-y-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="capitalize">{course.course_type.replace(/_/g, ' ')}</span>
        </div>
        {course.category && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <FileText className="w-3.5 h-3.5" />
            <span>{course.category}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CurriculumSection({
  modules,
  topicMap,
}: {
  modules: CourseModule[];
  topicMap: Record<string, CourseTopic[]>;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([modules[0]?.id ?? '']));

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalTopics = Object.values(topicMap).flat().length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-zinc-900">Course Curriculum</h2>
        <span className="text-xs text-zinc-400">
          {modules.length} modules · {totalTopics} topics
        </span>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-10 bg-zinc-50 rounded-xl border border-zinc-100">
          <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Curriculum coming soon.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...modules].sort((a, b) => a.order_index - b.order_index).map((mod) => {
            const topics = [...(topicMap[mod.id] ?? [])].sort((a, b) => a.order_index - b.order_index);
            const isOpen = expanded.has(mod.id);
            return (
              <div key={mod.id} className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => toggle(mod.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {mod.order_index + 1}
                    </div>
                    <span className="text-sm font-medium text-zinc-900 text-left truncate">
                      {mod.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-400">{topics.length} topics</span>
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-zinc-400" />
                      : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                  </div>
                </button>
                {isOpen && topics.length > 0 && (
                  <div className="border-t border-zinc-100 bg-zinc-50 divide-y divide-zinc-100">
                    {topics.map((topic) => (
                      <div key={topic.id} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-600">
                        <Circle className="w-3 h-3 text-zinc-300 shrink-0" />
                        {topic.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function B2bCourseDetail() {
  const params = useParams<{ tenant: string; id: string }>();
  const courseId = params.id;
  const { learner, tenantId, tenantSlug } = useB2BLearner();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [topicMap, setTopicMap] = useState<Record<string, CourseTopic[]>>({});
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  const learnerId = learner?.id;

  useEffect(() => {
    if (!tenantId || !courseId || !learnerId) return;

    Promise.all([
      supabase.from('courses').select('id, title, description, course_type, status, category').eq('id', courseId).single(),
      supabase.from('course_modules').select('*').eq('course_id', courseId).order('order_index'),
      supabase.from('learner_course_progress').select('progress_pct, status, started_at, completed_at')
        .eq('learner_id', learnerId).eq('tenant_id', tenantId).eq('course_id', courseId).maybeSingle(),
      supabase.from('certificates').select('id, certificate_number, issued_at')
        .eq('learner_id', learnerId).eq('tenant_id', tenantId)
        .eq('content_id', courseId).eq('content_type', 'COURSE').maybeSingle(),
    ]).then(([courseRes, modulesRes, progressRes, certRes]) => {
      if (courseRes.data) setCourse(courseRes.data as Course);

      const mods = (modulesRes.data ?? []) as CourseModule[];
      setModules(mods);

      if (progressRes.data) setProgress(progressRes.data as LearnerProgress);
      if (certRes.data) setCertificate(certRes.data as Certificate);

      if (mods.length > 0) {
        supabase
          .from('course_topics').select('*')
          .in('module_id', mods.map((m) => m.id))
          .order('order_index')
          .then(({ data }) => {
            const map: Record<string, CourseTopic[]> = {};
            (data ?? []).forEach((t: CourseTopic) => {
              map[t.module_id] = [...(map[t.module_id] ?? []), t];
            });
            setTopicMap(map);
          });
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tenantId, courseId, learnerId]);

  const totalTopics = Object.values(topicMap).flat().length;

  if (loading) {
    return (
      <>
        <B2BNavbar />
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <B2BNavbar />
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-sm text-zinc-500">Course not found.</p>
          </div>
        </main>
      </>
    );
  }

  const typeColorClass = COURSE_TYPE_COLOR[course.course_type] ?? 'bg-zinc-100 text-zinc-600';

  return (
    <>
      <B2BNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <button
          onClick={() => router.push(`/b2b-learner/${tenantSlug}/courses`)}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: main content ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero */}
            <section>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {course.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
                    {course.category}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColorClass}`}>
                  {course.course_type.replace(/_/g, ' ')}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-zinc-900 leading-snug">{course.title}</h1>

              {course.description && (
                <p className="text-sm text-zinc-600 mt-3 leading-relaxed">{course.description}</p>
              )}
            </section>

            {/* What you'll learn */}
            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-3">What you&apos;ll learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Comprehensive understanding of all modules',
                  'Practical knowledge for real-world use',
                  'Self-paced study with structured topics',
                  'Certificate of completion',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-zinc-600">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <CurriculumSection modules={modules} topicMap={topicMap} />

            {/* Stats row (mobile: shown below curriculum, desktop: hidden — sidebar handles it) */}
            <section className="lg:hidden grid grid-cols-3 gap-3">
              <div className="bg-zinc-50 rounded-lg p-3 text-center">
                <BarChart2 className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
                <p className="text-base font-semibold text-zinc-900">{progress?.progress_pct ?? 0}%</p>
                <p className="text-xs text-zinc-500">Progress</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3 text-center">
                <BookOpen className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
                <p className="text-base font-semibold text-zinc-900">{modules.length}</p>
                <p className="text-xs text-zinc-500">Modules</p>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3 text-center">
                <FileText className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
                <p className="text-base font-semibold text-zinc-900">{totalTopics}</p>
                <p className="text-xs text-zinc-500">Topics</p>
              </div>
            </section>
          </div>

          {/* ── Right: sticky action panel ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ActionPanel
                course={course}
                progress={progress}
                certificate={certificate}
                totalTopics={totalTopics}
                totalModules={modules.length}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function B2bCourseDetailPage() {
  return (
    <B2BAuthGuard>
      <Suspense>
        <B2bCourseDetail />
      </Suspense>
    </B2BAuthGuard>
  );
}
