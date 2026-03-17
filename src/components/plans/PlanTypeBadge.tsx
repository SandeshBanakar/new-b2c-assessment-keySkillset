import { type PlanType } from '@/lib/supabase/plans'

type Props = { type: PlanType }

const config: Record<PlanType, { label: string; classes: string }> = {
  WHOLE_PLATFORM: {
    label: 'Whole Platform',
    classes: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  CATEGORY_BUNDLE: {
    label: 'Category Bundle',
    classes: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
}

export function PlanTypeBadge({ type }: Props) {
  const c = config[type]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${c.classes}`}>
      {c.label}
    </span>
  )
}
