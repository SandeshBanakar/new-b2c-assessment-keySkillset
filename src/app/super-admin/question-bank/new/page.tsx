'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import QuestionForm from '../_components/QuestionForm'

function NewQuestionPageInner() {
  const params = useSearchParams()
  const chapterId = params.get('chapterId') ?? undefined
  const sourceId = params.get('sourceId') ?? undefined

  return <QuestionForm mode="create" defaultChapterId={chapterId} defaultSourceId={sourceId} />
}

export default function NewQuestionPage() {
  return (
    <Suspense>
      <NewQuestionPageInner />
    </Suspense>
  )
}
