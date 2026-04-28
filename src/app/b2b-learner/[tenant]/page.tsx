'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, CheckCircle2, Circle, Clock, Award, Building2,
  ArrowRight, Sparkles, FileQuestion, Info,
} from 'lucide-react';
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

interface AssignedAssessment {
  id: string;
  title: string;
  test_type: string;
  exam_categories: { name: string }[] | null;
}

interface LearnerCourseProgress {
  course_id: string;
  status: CourseStatus;
  progress_pct: number;
  started_at: string | null;
  completed_at: string | null;
}

interface AssignedAccess {
  content_id: string;
  content_type: 'COURSE' | 'ASSESSMENT';
  granted_at: string;
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
  inProgressCount,
  completedCount,
  assessmentsCompletedCount,
  certCount,
}: {
  fullName: string;
  department: Department | null;
  overallProgress: number;
  inProgressCount: number;
  completedCount: number;
  assessmentsCompletedCount: number;
  certCount: number;
}) {
  const stats = [
    { label: 'Courses In Progress', value: inProgressCount,          icon: Clock,         info: null },
    { label: 'Courses Completed',   value: completedCount,           icon: CheckCircle2,  info: null },
    { label: 'Assessments Done',    value: assessmentsCompletedCount, icon: FileQuestion, info: 'Counts assessments with 5 or more completed attempts' },
    { label: 'Certificates',        value: certCount,                icon: Award,         info: null },
  ];

  return (
    <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-xl p-5 md:p-6 text-white">
      {/* Top row */}
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

      {/* Stat cards — 2×2 on mobile, 4-col on sm+ */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, info }) => (
          <div key={label} className="bg-white/10 border border-white/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-teal-100 shrink-0" />
              <p className="text-lg font-semibold text-white">{value}</p>
              {info && (
                <span title={info} className="shrink-0 cursor-default">
                  <Info className="w-3 h-3 text-teal-100/60" />
                </span>
              )}
            </div>
            <p className="text-xs text-teal-100 mt-0.5 leading-snug">{label}</p>
          </div>
        ))}
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

function NewlyAssignedSection({
  newCourses,
  newAssessments,
  tenantSlug,
  accessMap,
}: {
  newCourses: B2BCourse[];
  newAssessments: AssignedAssessment[];
  tenantSlug: string;
  accessMap: Record<string, string>; // content_id → created_at
}) {
  const router = useRouter();
  const [infoVisible, setInfoVisible] = useState(false);

  if (newCourses.length === 0 && newAssessments.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-zinc-900">Newly Assigned</h2>
        <div className="relative">
          <button
            onClick={() => setInfoVisible((v) => !v)}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Assignment date info"
          >
            <Info className="w-4 h-4" />
          </button>
          {infoVisible && (
            <div className="absolute left-0 top-6 z-20 w-64 bg-zinc-800 text-white text-xs rounded-lg px-3 py-2.5 shadow-lg">
              Assignment date reflects when your administrator assigned this content to you.
              <div className="absolute -top-1.5 left-2 w-3 h-3 bg-zinc-800 rotate-45" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* New Courses */}
        {newCourses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">New Courses</p>
            {newCourses.map((course) => (
              <button
                key={course.id}
                onClick={() => router.push(`/b2b-learner/${tenantSlug}/courses/${course.id}`)}
                className="w-full flex items-center gap-3 bg-white border border-zinc-200 rounded-lg p-3 text-left hover:border-teal-300 hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-teal-700 transition-colors">
                    {course.title}
                  </p>
                  {course.category && (
                    <p className="text-xs text-zinc-400 truncate">{course.category}</p>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
                  <Sparkles className="w-3 h-3" /> New
                </span>
              </button>
            ))}
          </div>
        )}

        {/* New Assessments */}
        {newAssessments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">New Assessments</p>
            {newAssessments.map((assessment) => (
              <button
                key={assessment.id}
                onClick={() => router.push(`/b2b-learner/${tenantSlug}/assessments/${assessment.id}`)}
                className="w-full flex items-center gap-3 bg-white border border-zinc-200 rounded-lg p-3 text-left hover:border-teal-300 hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <FileQuestion className="w-4 h-4 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-teal-700 transition-colors">
                    {assessment.title}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {assessment.exam_categories?.[0]?.name ?? assessment.test_type.replace(/_/g, ' ')}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
                  <Sparkles className="w-3 h-3" /> New
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MyLearningContent() {
  const { learner, tenantId, tenantSlug } = useB2BLearner();
  const router = useRouter();

  const [courses, setCourses] = useState<B2BCourse[]>([]);
  const [assignedAssessments, setAssignedAssessments] = useState<AssignedAssessment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, LearnerCourseProgress>>({});
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [certCount, setCertCount] = useState(0);
  const [assignedAccess, setAssignedAccess] = useState<AssignedAccess[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  const learnerId = learner!.id;

  useEffect(() => {
    if (!tenantId || !learnerId) return;

    async function doFetch() {
      const [accessRes, progressRes, attemptsRes, certsRes, deptRes] = await Promise.all([
        supabase
          .from('learner_content_access')
          .select('content_id, content_type, granted_at')
          .eq('learner_id', learnerId)
          .eq('tenant_id', tenantId)
          .is('revoked_at', null)
          .order('granted_at', { ascending: false }),
        supabase
          .from('learner_course_progress')
          .select('course_id, status, progress_pct, started_at, completed_at')
          .eq('learner_id', learnerId)
          .eq('tenant_id', tenantId),
        supabase
          .from('learner_attempts')
          .select('content_id')
          .eq('learner_id', learnerId)
          .eq('tenant_id', tenantId)
          .eq('content_type', 'ASSESSMENT'),
        supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learnerId)
          .eq('tenant_id', tenantId),
        learner?.department_id
          ? supabase.from('departments').select('id, name').eq('id', learner.department_id).single()
          : Promise.resolve({ data: null }),
      ]);

      const access = (accessRes.data ?? []) as AssignedAccess[];
      const courseIds = access.filter((a) => a.content_type === 'COURSE').map((a) => a.content_id);
      const assessmentIds = access.filter((a) => a.content_type === 'ASSESSMENT').map((a) => a.content_id);

      const progressData = progressRes.data ?? [];
      const progressMapBuilt: Record<string, LearnerCourseProgress> = {};
      progressData.forEach((p: LearnerCourseProgress) => { progressMapBuilt[p.course_id] = p; });

      const attemptData = attemptsRes.data ?? [];
      const countsBuilt: Record<string, number> = {};
      attemptData.forEach((a: { content_id: string }) => {
        countsBuilt[a.content_id] = (countsBuilt[a.content_id] ?? 0) + 1;
      });

      const [coursesRes, assessmentsRes] = await Promise.all([
        courseIds.length > 0
          ? supabase.from('courses').select('id, title, description, course_type, category, status').in('id', courseIds)
          : Promise.resolve({ data: [] }),
        assessmentIds.length > 0
          ? supabase.from('assessment_items').select('id, title, test_type, exam_categories(name)').in('id', assessmentIds)
          : Promise.resolve({ data: [] }),
      ]);

      return {
        access,
        courses: (coursesRes.data ?? []) as B2BCourse[],
        assessments: (assessmentsRes.data ?? []) as AssignedAssessment[],
        progressMap: progressMapBuilt,
        attemptCounts: countsBuilt,
        certCount: certsRes.count ?? 0,
        department: deptRes.data ? { id: (deptRes.data as any).id, name: (deptRes.data as any).name } : null,
      };
    }

    doFetch().then(({ access, courses, assessments, progressMap, attemptCounts, certCount, department }) => {
      setAssignedAccess(access);
      setCourses(courses);
      setAssignedAssessments(assessments);
      setProgressMap(progressMap);
      setAttemptCounts(attemptCounts);
      setCertCount(certCount);
      setDepartment(department);
      setLoading(false);
    });
  }, [tenantId, learnerId]);

  const inProgressCourses = courses.filter((c) => progressMap[c.id]?.status === 'IN_PROGRESS');
  const inProgressCount = inProgressCourses.length;
  const completedCount = courses.filter((c) => progressMap[c.id]?.status === 'COMPLETED').length;
  const assessmentsCompletedCount = assignedAssessments.filter((a) => (attemptCounts[a.id] ?? 0) >= 5).length;

  const overallProgress = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + (progressMap[c.id]?.progress_pct ?? 0), 0) / courses.length)
    : 0;

  // Newly assigned: most recent 2 per type from access log
  const newCourses = assignedAccess
    .filter((a) => a.content_type === 'COURSE')
    .slice(0, 2)
    .map((a) => courses.find((c) => c.id === a.content_id))
    .filter((c): c is B2BCourse => !!c);

  const newAssessments = assignedAccess
    .filter((a) => a.content_type === 'ASSESSMENT')
    .slice(0, 2)
    .map((a) => assignedAssessments.find((x) => x.id === a.content_id))
    .filter((a): a is AssignedAssessment => !!a);

  // access map for info tooltip (content_id → created_at)
  const accessMap: Record<string, string> = {};
  assignedAccess.forEach((a) => { accessMap[a.content_id] = a.granted_at; });

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
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        assessmentsCompletedCount={assessmentsCompletedCount}
        certCount={certCount}
      />

      {/* Newly Assigned */}
      <NewlyAssignedSection
        newCourses={newCourses}
        newAssessments={newAssessments}
        tenantSlug={tenantSlug}
        accessMap={accessMap}
      />

      {/* Continue Learning */}
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
            <p className="text-xs text-zinc-400 mt-1">Browse your assigned courses to get started</p>
            <button
              onClick={() => router.push(`/b2b-learner/${tenantSlug}/courses`)}
              className="mt-4 px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md hover:bg-teal-800 transition-colors"
            >
              View My Courses
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
