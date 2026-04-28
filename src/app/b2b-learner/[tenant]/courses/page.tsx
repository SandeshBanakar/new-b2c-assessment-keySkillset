'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Tag, Monitor, Award, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';
import { formatCourseType } from '@/lib/utils';

type CourseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

interface B2BCourse {
  id: string;
  title: string;
  description: string | null;
  course_type: string;
  category: string | null;
  status: string;
}

interface LearnerCourseProgress {
  course_id: string;
  status: CourseStatus;
  progress_pct: number;
  started_at: string | null;
  completed_at: string | null;
}

const COURSE_TYPE_COLORS: Record<string, string> = {
  CLICK_BASED:      'bg-teal-50 text-teal-700 border border-teal-200',
  CODING_SANDBOX:   'bg-violet-50 text-violet-700 border border-violet-200',
  COMBINATION:      'bg-blue-50 text-blue-700 border border-blue-200',
  KEYBOARD_TRAINER: 'bg-amber-50 text-amber-700 border border-amber-200',
  VIDEO:            'bg-indigo-50 text-indigo-700 border border-indigo-200',
  DOCUMENT:         'bg-zinc-100 text-zinc-600 border border-zinc-200',
};

const PLACEHOLDER_BG: Record<string, string> = {
  CLICK_BASED:      'bg-teal-100',
  CODING_SANDBOX:   'bg-violet-100',
  COMBINATION:      'bg-blue-100',
  KEYBOARD_TRAINER: 'bg-amber-100',
  VIDEO:            'bg-indigo-100',
  DOCUMENT:         'bg-zinc-100',
};

function CoursePlaceholder({ courseType }: { courseType: string }) {
  const bg = PLACEHOLDER_BG[courseType] ?? 'bg-zinc-100';
  return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <BookOpen className="w-10 h-10 text-zinc-400" />
    </div>
  );
}

function CourseCard({
  course,
  progress,
  tenantSlug,
}: {
  course: B2BCourse;
  progress: LearnerCourseProgress | null;
  tenantSlug: string;
}) {
  const router = useRouter();
  const status: CourseStatus = progress?.status ?? 'NOT_STARTED';
  const progressPct = progress?.progress_pct ?? 0;
  const isCompleted = status === 'COMPLETED';
  const courseTypeLabel = formatCourseType(course.course_type) ?? course.course_type.replace(/_/g, ' ');
  const typePillClass = COURSE_TYPE_COLORS[course.course_type] ?? 'bg-zinc-100 text-zinc-600 border border-zinc-200';

  const detailUrl = `/b2b-learner/${tenantSlug}/courses/${course.id}`;
  const ctaUrl = isCompleted ? `${detailUrl}?tab=achievements` : detailUrl;

  function handleCta(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(ctaUrl);
  }

  return (
    <div
      onClick={() => router.push(detailUrl)}
      className="bg-white border border-zinc-200 rounded-xl overflow-hidden cursor-pointer hover:border-teal-300 hover:shadow-md transition-all flex flex-col"
    >
      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-zinc-100">
        <CoursePlaceholder courseType={course.course_type} />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Title */}
        <h3 className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2">
          {course.title}
        </h3>

        {/* Pills row */}
        <div className="flex flex-wrap gap-1.5">
          {course.category && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              <Tag className="w-3 h-3 shrink-0" />
              {course.category}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${typePillClass}`}>
            <Monitor className="w-3 h-3 shrink-0" />
            {courseTypeLabel}
          </span>
        </div>

        {/* Completed on date */}
        {isCompleted && progress?.completed_at && (
          <p className="text-xs text-zinc-500">
            Completed on:{' '}
            {new Date(progress.completed_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}

        {/* Progress — shown on all states */}
        <div className="mt-auto space-y-1">
          <p className="text-xs text-zinc-500">{progressPct}% completed</p>
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isCompleted ? 'bg-emerald-500' : progressPct > 0 ? 'bg-teal-600' : 'bg-zinc-200'
              }`}
              style={{ width: `${Math.max(progressPct, 0)}%` }}
            />
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={handleCta}
          className="w-full py-2.5 text-sm font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
        >
          {isCompleted ? (
            <>
              <Award className="w-4 h-4" />
              View Certificate
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              Continue Learning
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CoursesContent() {
  const { learner, tenantId, tenantSlug } = useB2BLearner();
  const router = useRouter();

  const [courses, setCourses] = useState<B2BCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, LearnerCourseProgress>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const learnerId = learner!.id;

  useEffect(() => {
    if (!tenantId || !learnerId) return;

    async function doFetch() {
      const { data: accessData } = await supabase
        .from('learner_content_access')
        .select('content_id')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId)
        .eq('content_type', 'COURSE')
        .is('revoked_at', null);

      const courseIds = (accessData ?? []).map((a: { content_id: string }) => a.content_id);
      if (courseIds.length === 0) return { courses: [], progressMap: {} };

      const [coursesRes, progressRes] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, description, course_type, category, status')
          .in('id', courseIds),
        supabase
          .from('learner_course_progress')
          .select('course_id, status, progress_pct, started_at, completed_at')
          .eq('learner_id', learnerId)
          .eq('tenant_id', tenantId),
      ]);

      const map: Record<string, LearnerCourseProgress> = {};
      (progressRes.data ?? []).forEach((p: LearnerCourseProgress) => {
        map[p.course_id] = p;
      });

      return { courses: (coursesRes.data ?? []) as B2BCourse[], progressMap: map };
    }

    doFetch().then(({ courses, progressMap }) => {
      setCourses(courses);
      setProgressMap(progressMap);
      setLoading(false);
    });
  }, [tenantId, learnerId]);

  const categories = useMemo(() => {
    const cats = new Set(courses.map((c) => c.category).filter((c): c is string => !!c));
    return ['ALL', ...Array.from(cats).sort()];
  }, [courses]);

  const filtered = courses.filter((course) => {
    const status = progressMap[course.id]?.status ?? 'NOT_STARTED';
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || course.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const countByStatus = (s: CourseStatus) =>
    courses.filter((c) => (progressMap[c.id]?.status ?? 'NOT_STARTED') === s).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">My Courses</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {courses.length} course{courses.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.length > 2 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        )}

        {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((s) => {
          const label =
            s === 'ALL' ? 'All' :
            s === 'NOT_STARTED' ? 'Not Started' :
            s === 'IN_PROGRESS' ? 'In Progress' : 'Completed';
          const count = s !== 'ALL' ? countByStatus(s) : courses.length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                statusFilter === s
                  ? 'bg-teal-700 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-xl border border-zinc-200">
          <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">
            {courses.length === 0
              ? 'No courses assigned yet. Contact your administrator.'
              : 'No courses match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={progressMap[course.id] ?? null}
              tenantSlug={tenantSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function B2bCoursesPage() {
  return (
    <B2BAuthGuard>
      <B2BNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <CoursesContent />
      </main>
    </B2BAuthGuard>
  );
}
