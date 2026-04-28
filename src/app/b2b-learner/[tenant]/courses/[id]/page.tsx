'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen, Award, ArrowLeft, FileText, PlayCircle,
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Trophy, Download, Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';
import { formatCourseType } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseTab = 'overview' | 'curriculum' | 'achievements';

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
  content_title: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_TYPE_HERO_STYLE: Record<string, React.CSSProperties> = {
  CLICK_BASED:      { background: 'linear-gradient(135deg, #0d9488, #115e59)' },
  CODING_SANDBOX:   { background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' },
  COMBINATION:      { background: 'linear-gradient(135deg, #2563eb, #1e40af)' },
  KEYBOARD_TRAINER: { background: 'linear-gradient(135deg, #d97706, #92400e)' },
  VIDEO:            { background: 'linear-gradient(135deg, #4f46e5, #3730a3)' },
  DOCUMENT:         { background: 'linear-gradient(135deg, #52525b, #27272a)' },
};

const MILESTONES = [
  { key: 'welcome',  label: 'Welcome Champion',   threshold: 0 },
  { key: 'quarter',  label: 'Quarter Quest',       threshold: 25 },
  { key: 'halfway',  label: 'Halfway Hero',        threshold: 50 },
  { key: 'summit',   label: 'Summit Conqueror',    threshold: 75 },
  { key: 'champion', label: 'Course Champion',     threshold: 100 },
];

const WHAT_YOULL_LEARN = [
  'Comprehensive module-based learning',
  'Practical skills for immediate application',
  'Self-paced flexible learning',
  'Certificate of completion on finishing',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} className="fill-none stroke-zinc-100" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r}
        className={`fill-none transition-all duration-700 ${pct >= 100 ? 'stroke-emerald-500' : 'stroke-teal-600'}`}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MilestoneUnlocked({ pct, started }: { pct: number; started: boolean }) {
  return (m: typeof MILESTONES[0]) => {
    if (m.threshold === 0) return started;
    return pct >= m.threshold;
  };
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({
  course,
  modules,
  totalTopics,
  progress,
  certificate,
  tenantSlug,
  onSwitchTab,
}: {
  course: Course;
  modules: CourseModule[];
  totalTopics: number;
  progress: LearnerProgress | null;
  certificate: Certificate | null;
  tenantSlug: string;
  onSwitchTab: (t: CourseTab) => void;
}) {
  const router = useRouter();
  const pct = progress?.progress_pct ?? 0;
  const isCompleted = progress?.status === 'COMPLETED';
  const isStarted = !!progress?.started_at;
  const heroStyle = COURSE_TYPE_HERO_STYLE[course.course_type] ?? { background: 'linear-gradient(135deg, #52525b, #27272a)' };
  const courseTypeLabel = formatCourseType(course.course_type) ?? course.course_type.replace(/_/g, ' ');

  function handleCta(e: React.MouseEvent) {
    e.stopPropagation();
    if (isCompleted) {
      onSwitchTab('achievements');
    }
    // Start/Continue: placeholder — exam engine wiring is a separate ticket
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="rounded-xl p-6 text-white" style={heroStyle}>
        <div className="flex items-center gap-1 mb-2 text-white/70 text-sm">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-white font-medium">4.9</span>
          <span className="ml-1 opacity-60">· 500+ learners</span>
        </div>
        <h1 className="text-2xl font-semibold leading-snug">{course.title}</h1>
        {course.description && (
          <p className="text-sm text-white/80 mt-2 leading-relaxed line-clamp-3">{course.description}</p>
        )}
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Circle className="w-4 h-4 text-zinc-400" />, value: 'Flexible Time', label: 'Pace' },
          { icon: <BookOpen className="w-4 h-4 text-zinc-400" />, value: modules.length, label: 'Modules' },
          { icon: <FileText className="w-4 h-4 text-zinc-400" />, value: courseTypeLabel, label: 'Course Type' },
          { icon: <CheckCircle2 className="w-4 h-4 text-zinc-400" />, value: 'English', label: 'Language' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-50 rounded-lg p-3 sm:p-4">
            <div className="mb-1">{stat.icon}</div>
            <p className="text-sm font-semibold text-zinc-900 truncate">{stat.value}</p>
            <p className="text-xs text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: About + What you'll learn */}
        <div className="lg:col-span-2 space-y-5">
          {course.description && (
            <section>
              <h2 className="text-base font-semibold text-zinc-900 mb-2">About This Course</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{course.description}</p>
            </section>
          )}

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">What you&apos;ll learn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WHAT_YOULL_LEARN.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-zinc-600">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Assigned panel */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 shadow-sm sticky top-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <ProgressRing pct={pct} />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-zinc-900">
                  {pct}%
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-zinc-900">
                  {isCompleted ? 'Completed' : isStarted ? 'In Progress' : 'Not Started'}
                </p>
                <p className="text-xs text-zinc-500">{modules.length} modules · {totalTopics} topics</p>
              </div>
            </div>

            <button
              onClick={handleCta}
              className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isCompleted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-teal-700 text-white hover:bg-teal-800'
              }`}
            >
              {isCompleted
                ? <><Award className="w-4 h-4" /> View Certificate</>
                : <><PlayCircle className="w-4 h-4" /> {isStarted ? 'Continue Course' : 'Start Course'}</>
              }
            </button>

            <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-zinc-700 font-medium">Included</span>
              </div>
              <div className="flex justify-between">
                <span>Started</span>
                <span className="text-zinc-700 font-medium">
                  {progress?.started_at
                    ? new Date(progress.started_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Certificate</span>
                <span className="text-zinc-700 font-medium">Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Curriculum ──────────────────────────────────────────────────────────

function CurriculumTab({
  modules,
  topicMap,
  progress,
}: {
  modules: CourseModule[];
  topicMap: Record<string, CourseTopic[]>;
  progress: LearnerProgress | null;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([modules[0]?.id ?? '']));
  const pct = progress?.progress_pct ?? 0;
  const isStarted = !!progress?.started_at;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalTopics = Object.values(topicMap).flat().length;

  function isMilestoneUnlocked(threshold: number) {
    if (threshold === 0) return isStarted;
    return pct >= threshold;
  }

  return (
    <div className="space-y-6">
      {/* Achievement Progress stepper */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-1">Achievement Progress</h2>
        <p className="text-xs text-zinc-500 mb-5">
          {MILESTONES.filter((m) => isMilestoneUnlocked(m.threshold)).length} of {MILESTONES.length} milestones reached
        </p>

        <div className="overflow-x-auto pb-1">
          <div className="flex items-start min-w-max gap-0">
            {MILESTONES.map((m, idx) => {
              const unlocked = isMilestoneUnlocked(m.threshold);
              const isLast = idx === MILESTONES.length - 1;
              return (
                <div key={m.key} className="flex items-center">
                  <div className="flex flex-col items-center gap-2 w-24">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      unlocked
                        ? 'bg-amber-50 border-amber-400 text-amber-500'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-300'
                    }`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <p className={`text-xs text-center leading-tight ${unlocked ? 'text-zinc-700 font-medium' : 'text-zinc-400'}`}>
                      {m.label}
                    </p>
                  </div>
                  {!isLast && (
                    <div className={`h-0.5 w-8 mx-1 mb-5 rounded-full transition-colors ${
                      isMilestoneUnlocked(MILESTONES[idx + 1].threshold) ? 'bg-amber-300' : 'bg-zinc-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Course curriculum accordion */}
      <div>
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
      </div>
    </div>
  );
}

// ─── Tab: Achievements ────────────────────────────────────────────────────────

function AchievementsTab({
  certificate,
  progress,
  tenantSlug,
}: {
  certificate: Certificate | null;
  progress: LearnerProgress | null;
  tenantSlug: string;
}) {
  const pct = progress?.progress_pct ?? 0;
  const isStarted = !!progress?.started_at;

  function isMilestoneUnlocked(threshold: number) {
    if (threshold === 0) return isStarted;
    return pct >= threshold;
  }

  function handleDownload(id: string) {
    window.open(`/b2b-learner/${tenantSlug}/certificates/${id}/preview`, '_blank');
  }

  return (
    <div className="space-y-8">
      {/* Certifications section */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Certifications</h2>
        {!certificate ? (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-6 py-8 text-center">
            <Award className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Complete the course to earn your certificate.</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <div className="h-1.5 bg-linear-to-r from-emerald-400 to-teal-500" />
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{certificate.content_title}</p>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">{certificate.certificate_number}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Issued:{' '}
                    {new Date(certificate.issued_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(certificate.id)}
                className="inline-flex items-center gap-1.5 text-sm text-teal-700 hover:text-teal-800 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Achievements section */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 mb-4">Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {MILESTONES.map((m) => {
            const unlocked = isMilestoneUnlocked(m.threshold);
            return (
              <div
                key={m.key}
                className={`border rounded-xl p-4 flex flex-col items-center gap-3 text-center transition-colors ${
                  unlocked
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  unlocked ? 'bg-amber-100' : 'bg-zinc-100'
                }`}>
                  {/* TODO: Replace lucide Trophy with final production medal images when available */}
                  <Trophy className={`w-7 h-7 ${unlocked ? 'text-amber-500' : 'text-zinc-300'}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${unlocked ? 'text-amber-800' : 'text-zinc-400'}`}>
                    {m.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${unlocked ? 'text-amber-600' : 'text-zinc-400'}`}>
                    {unlocked ? 'Unlocked' : `Reach ${m.threshold === 0 ? 'start' : m.threshold + '%'}`}
                  </p>
                </div>
                {!unlocked && (
                  <span className="text-xs px-2 py-0.5 bg-zinc-200 text-zinc-500 rounded-full">Locked</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-zinc-400 text-center leading-relaxed">
          Course achievement medals shown here are for reference only. The production medal images will replace these icons.
        </p>
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function B2bCourseDetail() {
  const params = useParams<{ tenant: string; id: string }>();
  const searchParams = useSearchParams();
  const courseId = params.id;
  const { learner, tenantId, tenantSlug } = useB2BLearner();
  const router = useRouter();

  const initialTab = (searchParams.get('tab') as CourseTab | null);
  const [activeTab, setActiveTab] = useState<CourseTab>(
    initialTab === 'curriculum' || initialTab === 'achievements' ? initialTab : 'overview'
  );

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [topicMap, setTopicMap] = useState<Record<string, CourseTopic[]>>({});
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  const learnerId = learner?.id;

  useEffect(() => {
    if (!tenantId || !courseId || !learnerId) return;
    supabase
      .from('learner_content_access')
      .select('content_id', { count: 'exact', head: true })
      .eq('learner_id', learnerId)
      .eq('tenant_id', tenantId)
      .eq('content_id', courseId)
      .eq('content_type', 'COURSE')
      .is('revoked_at', null)
      .then(({ count }) => {
        if (!count || count === 0) router.replace(`/b2b-learner/${tenantSlug}/courses`);
      });
  }, [tenantId, courseId, learnerId, tenantSlug, router]);

  useEffect(() => {
    if (!tenantId || !courseId || !learnerId) return;

    Promise.all([
      supabase.from('courses').select('id, title, description, course_type, status, category').eq('id', courseId).single(),
      supabase.from('course_modules').select('*').eq('course_id', courseId).order('order_index'),
      supabase.from('learner_course_progress')
        .select('progress_pct, status, started_at, completed_at')
        .eq('learner_id', learnerId).eq('tenant_id', tenantId).eq('course_id', courseId).maybeSingle(),
      supabase.from('certificates')
        .select('id, certificate_number, issued_at, content_title')
        .eq('learner_id', learnerId).eq('tenant_id', tenantId)
        .eq('content_id', courseId).eq('content_type', 'COURSE').maybeSingle(),
    ]).then(([courseRes, modulesRes, progressRes, certRes]) => {
      if (courseRes.data) setCourse(courseRes.data as Course);
      const mods = (modulesRes.data ?? []) as CourseModule[];
      setModules(mods);
      if (progressRes.data) setProgress(progressRes.data as LearnerProgress);
      if (certRes.data) setCertificate(certRes.data as Certificate);

      if (mods.length > 0) {
        supabase.from('course_topics').select('*')
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

  const TABS: { id: CourseTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'achievements', label: 'Achievements' },
  ];

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

        {/* Tab bar */}
        <div className="border-b border-zinc-200 mb-6">
          <div className="flex items-center overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-700 text-teal-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <OverviewTab
            course={course}
            modules={modules}
            totalTopics={totalTopics}
            progress={progress}
            certificate={certificate}
            tenantSlug={tenantSlug}
            onSwitchTab={setActiveTab}
          />
        )}
        {activeTab === 'curriculum' && (
          <CurriculumTab
            modules={modules}
            topicMap={topicMap}
            progress={progress}
          />
        )}
        {activeTab === 'achievements' && (
          <AchievementsTab
            certificate={certificate}
            progress={progress}
            tenantSlug={tenantSlug}
          />
        )}
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
