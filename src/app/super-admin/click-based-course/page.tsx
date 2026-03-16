import { MousePointerClick } from 'lucide-react'
import ComingSoonPage from '../_components/ComingSoonPage'

export default function ClickBasedCoursePage() {
  return (
    <ComingSoonPage
      icon={MousePointerClick}
      title="Click-based Course"
      description="Author screen-by-screen slide courses learners click through."
    />
  )
}
