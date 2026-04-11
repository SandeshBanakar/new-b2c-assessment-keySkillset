'use client'

import { useParams } from 'next/navigation'
import QuestionForm from '../../_components/QuestionForm'

export default function EditQuestionPage() {
  const params = useParams()
  const questionId = params.questionId as string

  return <QuestionForm mode="edit" questionId={questionId} />
}
