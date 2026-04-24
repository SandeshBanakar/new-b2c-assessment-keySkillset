'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, Circle, Clock, Award, Building2, ArrowRight, Sparkles } from 'lucide-react';
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

interface Department {
  id: string;
  name: string;
}

const COURSE_TYPE_COLORS: Record<string, string> = {
  CLICK_BASED: 'bg-teal-100 text-teal-600',
  CODING_SANDBOX: 'bg-violet-100 text-violet-600',
  COMBINATION: 'bg-blue-100 text-blue-600',
  KEYBOARD_TRAINER: 'bg-amber-100 text-amber-600',
  VIDEO: 'bg-indigo-100 text-indigo-600',
};

function CoursePlaceholder({ courseType, size = 'md' }: { courseType: string; size?: 'sm' | 'md' }) {
  const colorClass = COURSE_TYPE_COLORS[courseType] ?? 'bg-zinc-100 text-zinc-400';
  return (
    <div className={`w-full h-full flex items-center justify-center ${colorClass}`}>
      <BookOpen className={size === 'sm' ? 'w-6 h-6' : 'w-10 h-10'} />
    </div>
  );
}

function WelcomeHeader({
  fullName,
  department,
  overallProgress,
}: {
  fullName: string;
  department: Department | null;
  overallProgress: number;
}) {
  return (
    <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-xl p-5 md:p-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-teal-100 text-sm">Welcome back,</p>
          <h1 className="text-xl md:text-2xl font-semibold mt-0.5">{fullName}</h1>
          {department && (
            <div className="flex items-center gap-2 mt-2 text-teal-100">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="text-sm">{department.name}</span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-teal-100 text-xs">Overall Progress</p>
          <div className="mt-2 flex items-center gap-2 justify-end">
            <div className="w-20 md:w-24 h-2.5 bg-teal-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
            <span className="font-semibold text-sm">{overallProgress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-teal-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-zinc-900">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function InProgressCourseCard({
  course,
  progress,
  onClick,
}: {
  course: B2BCourse;
  progress: LearnerCourseProgress;
  onClick: () => void;
}) {
  const isNew = !progress.started_at;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-zinc-200 rounded-lg overflow-hidden cursor-pointer hover:border-teal-300 hover:shadow-md transition-all"
    >
      <div className="aspect-video bg-zinc-100 relative">
        <CoursePlaceholder courseType={course.course_type} />
        <div className="absolute top-2 right-2 flex gap-1.5">
          {isNew && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              New
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            In Progress
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
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Progress</span>
            <span>{progress.progress_pct}%</span>
          </div>
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all"
              style={{ width: `${progress.progress_pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MyLearningContent() {
  const { learner, tenantId, tenantSlug } = useB2BLearner();
  const router = useRouter();

  const [courses, setCourses] = useState<B2BCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, LearnerCourseProgress>>({});
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!learner?.department_id) return;
    supabase
      .from('departments')
      .select('id, name')
      .eq('id', learner.department_id)
      .single()
      .then(({ data }) => {
        if (data) setDepartment({ id: data.id, name: data.name });
      });
  }, [learner?.department_id]);

  const inProgressCourses = courses.filter((c) => progressMap[c.id]?.status === 'IN_PROGRESS');
  const completedCount = courses.filter((c) => progressMap[c.id]?.status === 'COMPLETED').length;
  const inProgressCount = inProgressCourses.length;

  const overallProgress =
    courses.length > 0
      ? Math.round(
          Object.values(progressMap).reduce((sum, p) => sum + (p.progress_pct ?? 0), 0) /
            courses.length
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeHeader
        fullName={learner!.full_name}
        department={department}
        overallProgress={overallProgress}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="In Progress" value={inProgressCount} icon={Clock} />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} />
        <StatCard label="Enrolled" value={courses.length} icon={BookOpen} />
      </div>

      {/* In progress section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Continue Learning</h2>
          <button
            onClick={() => router.push(`/b2b-learner/${tenantSlug}/courses`)}
            className="flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800 font-medium transition-colors"
          >
            All Courses <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {inProgressCourses.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 rounded-xl border border-zinc-200">
            <Circle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-500">No courses in progress yet</p>
            <p className="text-xs text-zinc-400 mt-1">Browse the course catalogue to get started</p>
            <button
              onClick={() => router.push(`/b2b-learner/${tenantSlug}/courses`)}
              className="mt-4 px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md hover:bg-teal-800 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressCourses.map((course) => (
              <InProgressCourseCard
                key={course.id}
                course={course}
                progress={progressMap[course.id]}
                onClick={() => router.push(`/b2b-learner/${tenantSlug}/courses/${course.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function B2bLearnerDashboard() {
  return (
    <B2BAuthGuard>
      <B2BNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <MyLearningContent />
      </main>
    </B2BAuthGuard>
  );
}
