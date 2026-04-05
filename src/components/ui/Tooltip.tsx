'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type Position = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  /** The element that triggers the tooltip */
  children: React.ReactNode
  /** Tooltip text content — multi-line supported, no rich text */
  content: string
  /** Preferred position hint. Auto-flips if viewport has no space. Default: 'top' */
  position?: Position
  /** Extra classes applied to the tooltip bubble (e.g. max-w-xs) */
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SHOW_DELAY = 300
const HIDE_DELAY = 150
const TOOLTIP_GAP = 8   // px between trigger edge and tooltip
const ARROW_SIZE = 6    // px — half the CSS triangle base

// Fallback order when preferred position is clipped
const FALLBACK: Record<Position, Position[]> = {
  top:    ['top', 'bottom', 'right', 'left'],
  bottom: ['bottom', 'top', 'right', 'left'],
  left:   ['left', 'right', 'top', 'bottom'],
  right:  ['right', 'left', 'top', 'bottom'],
}

// ─── Viewport space check ─────────────────────────────────────────────────────

function fitsInViewport(
  pos: Position,
  trigger: DOMRect,
  tooltipW: number,
  tooltipH: number,
): boolean {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const gap = TOOLTIP_GAP + ARROW_SIZE

  switch (pos) {
    case 'top':
      return trigger.top - tooltipH - gap >= 0
    case 'bottom':
      return trigger.bottom + tooltipH + gap <= vh
    case 'left':
      return trigger.left - tooltipW - gap >= 0
    case 'right':
      return trigger.right + tooltipW + gap <= vw
  }
}

// ─── Position calculator ──────────────────────────────────────────────────────

function calcCoords(
  pos: Position,
  trigger: DOMRect,
  tooltipW: number,
  tooltipH: number,
): { top: number; left: number } {
  const gap = TOOLTIP_GAP + ARROW_SIZE

  switch (pos) {
    case 'top':
      return {
        top:  trigger.top + window.scrollY - tooltipH - gap,
        left: trigger.left + window.scrollX + trigger.width / 2 - tooltipW / 2,
      }
    case 'bottom':
      return {
        top:  trigger.bottom + window.scrollY + gap,
        left: trigger.left + window.scrollX + trigger.width / 2 - tooltipW / 2,
      }
    case 'left':
      return {
        top:  trigger.top + window.scrollY + trigger.height / 2 - tooltipH / 2,
        left: trigger.left + window.scrollX - tooltipW - gap,
      }
    case 'right':
      return {
        top:  trigger.top + window.scrollY + trigger.height / 2 - tooltipH / 2,
        left: trigger.right + window.scrollX + gap,
      }
  }
}

// ─── Arrow classes ────────────────────────────────────────────────────────────

// The arrow is a CSS border-triangle absolutely positioned on the bubble.
// It points BACK toward the trigger.
function arrowClasses(pos: Position): string {
  const base = 'absolute w-0 h-0 '

  switch (pos) {
    case 'top':
      // Arrow points down (toward trigger below)
      return (
        base +
        'top-full left-1/2 -translate-x-1/2 ' +
        'border-l-[6px] border-l-transparent ' +
        'border-r-[6px] border-r-transparent ' +
        'border-t-[6px] border-t-zinc-900'
      )
    case 'bottom':
      // Arrow points up (toward trigger above)
      return (
        base +
        'bottom-full left-1/2 -translate-x-1/2 ' +
        'border-l-[6px] border-l-transparent ' +
        'border-r-[6px] border-r-transparent ' +
        'border-b-[6px] border-b-zinc-900'
      )
    case 'left':
      // Arrow points right (toward trigger on the right)
      return (
        base +
        'left-full top-1/2 -translate-y-1/2 ' +
        'border-t-[6px] border-t-transparent ' +
        'border-b-[6px] border-b-transparent ' +
        'border-l-[6px] border-l-zinc-900'
      )
    case 'right':
      // Arrow points left (toward trigger on the left)
      return (
        base +
        'right-full top-1/2 -translate-y-1/2 ' +
        'border-t-[6px] border-t-transparent ' +
        'border-b-[6px] border-b-transparent ' +
        'border-r-[6px] border-r-zinc-900'
      )
  }
}

// ─── Tooltip component ────────────────────────────────────────────────────────

export function Tooltip({
  children,
  content,
  position = 'top',
  className = '',
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const bubbleRef  = useRef<HTMLDivElement>(null)

  const [visible, setVisible]           = useState(false)
  const [coords, setCoords]             = useState({ top: 0, left: 0 })
  const [resolvedPos, setResolvedPos]   = useState<Position>(position)

  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Resolve position & coords ──────────────────────────────────────────────

  const resolvePosition = useCallback(() => {
    if (!triggerRef.current || !bubbleRef.current) return

    const trigger  = triggerRef.current.getBoundingClientRect()
    const bubble   = bubbleRef.current.getBoundingClientRect()
    const tw = bubble.width || 200
    const th = bubble.height || 40

    // Walk fallback order until one fits
    const resolved = FALLBACK[position].find(p =>
      fitsInViewport(p, trigger, tw, th)
    ) ?? position  // last resort: use preferred even if clipped

    setResolvedPos(resolved)
    setCoords(calcCoords(resolved, trigger, tw, th))
  }, [position])

  // ── Show / hide handlers ───────────────────────────────────────────────────

  const handleMouseEnter = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    showTimer.current = setTimeout(() => {
      setVisible(true)
    }, SHOW_DELAY)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
    }, HIDE_DELAY)
  }, [])

  // ── Recompute coords whenever tooltip becomes visible ──────────────────────

  useEffect(() => {
    if (visible) {
      // Allow the bubble to render first so getBoundingClientRect is accurate
      requestAnimationFrame(resolvePosition)
    }
  }, [visible, resolvePosition])

  // ── Cleanup timers on unmount ──────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  // ── Portal target ──────────────────────────────────────────────────────────

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {mounted && createPortal(
        <div
          ref={bubbleRef}
          role="tooltip"
          style={{
            position: 'absolute',
            top:  coords.top,
            left: coords.left,
            zIndex: 9999,
            // Two-pass: render off-screen first to measure, then snap to coords
            visibility: visible ? 'visible' : 'hidden',
            pointerEvents: 'none',
          }}
        >
          {/* Bubble */}
          <div
            className={`relative bg-zinc-900 text-white text-xs font-medium rounded-md px-3 py-2 whitespace-pre-wrap leading-snug max-w-xs ${className}`}
          >
            {content}
            {/* Arrow */}
            <span className={arrowClasses(resolvedPos)} aria-hidden="true" />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
