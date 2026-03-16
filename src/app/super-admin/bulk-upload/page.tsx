import { Upload } from 'lucide-react'
import ComingSoonPage from '../_components/ComingSoonPage'

export default function BulkUploadPage() {
  return (
    <ComingSoonPage
      icon={Upload}
      title="Bulk Upload"
      description="Import questions in bulk via structured CSV templates."
    />
  )
}
