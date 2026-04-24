'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Circle, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';

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
  CLICK_BASED: 'bg-teal-100 text-teal-600',
  CODING_SANDBOX: 'bg-violet-100 text-violet-600',
  COMBINATION: 'bg-blue-100 text-blue-600',
  KEYBOARD_TRAINER: 'bg-amber-100 text-amber-600',
  VIDEO: 'bg-indigo-100 text-indigo-600',
};

function CoursePlaceholder({ courseType }: { courseType: string }) {
  const colorClass = COURSE_TYPE_COLORS[courseType] ?? 'bg-zinc-100 text-zinc-400';
  return (
    <div className={`w-full h-full flex items-center justify-center ${colorClass}`}>
      <BookOpen className="w-10 h-10" />
    </div>
  );
}

const STATUS_CONFIG = {
  NOT_STARTED: { icon: Circle, label: 'Not Started', color: 'text-zinc-400', bg: 'bg-zinc-100' },
  IN_PROGRESS: { icon: Clock, label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-50' },
  COMPLETED: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

function CourseCard({
  course,
  progress,
  onClick,
}: {
  course: B2BCourse;
  progress: LearnerCourseProgress | null;
  onClick: () => void;
}) {
  const status: CourseStatus = progress?.status ?? 'NOT_STARTED';
  const progressPct = progress?.progress_pct ?? 0;
  const isNew = progress ? !progress.started_at : true;
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-zinc-200 rounded-lg overflow-hidden cursor-pointer hover:border-teal-300 hover:shadow-md transition-all"
    >
      <div className="aspect-video bg-zinc-100 relative">
        <CoursePlaceholder courseType={course.course_type} />
        <div className="absolute top-2 right-2 flex gap-1.5">
          {isNew && status === 'NOT_STARTED' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              New
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${config.bg} ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-zinc-900 text-sm line-clamp-2">{course.title}</h3>
        {course.category && (
          <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
            {course.category}
          </span>
        )}
        {status === 'IN_PROGRESS' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
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

    Promise.all([
      supabase
        .from('courses')
        .select('id, title, description, course_type, category, status')
        .eq('status', 'LIVE')
        .or(`audience_type.eq.BOTH,audience_type.eq.B2B_ONLY`)
        .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`),
      supabase
        .from('learner_course_progress')
        .select('course_id, status, progress_pct, started_at, completed_at')
        .eq('learner_id', learnerId)
        .eq('tenant_id', tenantId),
    ]).then(([coursesRes, progressRes]) => {
      const coursesData = (coursesRes.data ?? []) as B2BCourse[];
      const progressData = progressRes.data ?? [];

      const map: Record<string, LearnerCourseProgress> = {};
      progressData.forEach((p: LearnerCourseProgress) => {
        map[p.course_id] = p;
      });

      setCourses(coursesData);
      setProgressMap(map);
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
        <h1 className="text-lg font-semibold text-zinc-900">Course Catalogue</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
          ))}
        </select>

        {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((s) => {
          const label = s === 'ALL' ? 'All' : s === 'NOT_STARTED' ? 'Not Started' : s === 'IN_PROGRESS' ? 'In Progress' : 'Completed';
          const count = s !== 'ALL' ? countByStatus(s) : courses.length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                statusFilter === s ? 'bg-teal-700 text-white' : 'text-zinc-600 hover:bg-zinc-100'
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
          <p className="text-sm text-zinc-500">No courses match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={progressMap[course.id] ?? null}
              onClick={() => router.push(`/b2b-learner/${tenantSlug}/courses/${course.id}`)}
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
