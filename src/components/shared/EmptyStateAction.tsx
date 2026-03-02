interface EmptyStateActionProps {
  heading: string
  description?: string
  ctaLabel: string
  ctaHref: string
  icon?: React.ReactNode
}

export function EmptyStateAction({
  heading,
  description,
  ctaLabel,
  ctaHref,
  icon,
}: EmptyStateActionProps) {
  return (
    <div className="flex flex-col items-center justify-center
                    py-8 text-center gap-3">
      {icon && <div className="text-zinc-300 mb-1">{icon}</div>}
      <p className="text-sm font-semibold text-zinc-700">{heading}</p>
      {description && (
        <p className="text-xs text-zinc-400 max-w-xs">{description}</p>
      )}
      <a
        href={ctaHref}
        className="text-sm font-medium text-blue-600
                   hover:underline mt-1"
      >
        {ctaLabel} →
      </a>
    </div>
  )
}
