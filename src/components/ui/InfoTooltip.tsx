'use client'

import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

type InfoTooltipProps = {
  content: string
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-zinc-400 hover:text-zinc-600 transition-colors"
        aria-label="More information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-64 rounded-md bg-zinc-900 text-white text-xs font-medium px-3 py-2.5 shadow-lg leading-relaxed">
          {content}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-900" />
        </div>
      )}
    </div>
  )
}
