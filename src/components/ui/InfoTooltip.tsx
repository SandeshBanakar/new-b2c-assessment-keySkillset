'use client'

import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

type InfoTooltipProps = {
  content: string
}

type Align = 'left' | 'center' | 'right'

const TOOLTIP_WIDTH = 256 // w-64
const EDGE_MARGIN   = 8   // px clearance from viewport edge

export function InfoTooltip({ content }: InfoTooltipProps) {
  const [open, setOpen]   = useState(false)
  const [align, setAlign] = useState<Align>('center')
  const ref               = useRef<HTMLDivElement>(null)
  const btnRef            = useRef<HTMLButtonElement>(null)

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

  function handleClick() {
    if (!btnRef.current) {
      setOpen((v) => !v)
      return
    }
    const rect        = btnRef.current.getBoundingClientRect()
    const iconCenter  = rect.left + rect.width / 2
    const halfTooltip = TOOLTIP_WIDTH / 2

    if (iconCenter + halfTooltip > window.innerWidth - EDGE_MARGIN) {
      setAlign('right')
    } else if (iconCenter - halfTooltip < EDGE_MARGIN) {
      setAlign('left')
    } else {
      setAlign('center')
    }
    setOpen((v) => !v)
  }

  // Arrow tracks the icon center relative to the tooltip box.
  // Icon button is w-3.5 (14px); half = 7px. Arrow is w-2 (8px); half = 4px.
  const arrowClass =
    align === 'left'   ? 'absolute -top-1 left-[3px] w-2 h-2 rotate-45 bg-zinc-900' :
    align === 'right'  ? 'absolute -top-1 right-[3px] w-2 h-2 rotate-45 bg-zinc-900' :
                         'absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-zinc-900'

  const tooltipClass =
    align === 'left'   ? 'absolute left-0 top-full mt-1.5 z-50 w-64 rounded-md bg-zinc-900 text-white text-xs font-medium px-3 py-2.5 shadow-lg leading-relaxed' :
    align === 'right'  ? 'absolute right-0 top-full mt-1.5 z-50 w-64 rounded-md bg-zinc-900 text-white text-xs font-medium px-3 py-2.5 shadow-lg leading-relaxed' :
                         'absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-64 rounded-md bg-zinc-900 text-white text-xs font-medium px-3 py-2.5 shadow-lg leading-relaxed'

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className="text-zinc-400 hover:text-zinc-600 transition-colors"
        aria-label="More information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className={tooltipClass}>
          {content}
          <div className={arrowClass} />
        </div>
      )}
    </div>
  )
}
