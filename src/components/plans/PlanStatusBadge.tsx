type Props = { status: string }

const config: Record<string, { label: string; classes: string }> = {
  PUBLISHED: {
    label: 'Published',
    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  DRAFT: {
    label: 'Draft',
    classes: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  ARCHIVED: {
    label: 'Archived',
    classes: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
  },
}

export function PlanStatusBadge({ status }: Props) {
  const c = config[status] ?? config.DRAFT
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${c.classes}`}>
      {c.label}
    </span>
  )
}
