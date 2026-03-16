export default function ComingSoonPage({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <Icon className="w-10 h-10 text-zinc-200 mb-4" />
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="text-sm text-zinc-500 mt-1.5 max-w-xs leading-relaxed">
        {description}
      </p>
      <span className="mt-5 text-xs font-medium bg-zinc-100 text-zinc-400 rounded-md px-3 py-1.5">
        Coming Soon
      </span>
    </div>
  )
}
