'use client'

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 mt-16 py-4 px-6
                        flex items-center justify-between">
      <span className="text-xs text-zinc-400">
        Copyright © keySkillset 2026
      </span>
      <span className="text-xs text-zinc-400">
        Need help?{' '}
        <a
          href="mailto:contact@keyskillset.com"
          className="text-violet-600 hover:underline"
        >
          Contact support
        </a>
      </span>
    </footer>
  )
}
