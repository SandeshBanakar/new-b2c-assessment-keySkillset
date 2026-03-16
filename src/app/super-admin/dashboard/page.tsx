import { LayoutDashboard } from 'lucide-react'
import ComingSoonPage from '../_components/ComingSoonPage'

export default function DashboardPage() {
  return (
    <ComingSoonPage
      icon={LayoutDashboard}
      title="Platform Dashboard"
      description="Real-time health metrics across all tenants, content, and plans."
    />
  )
}
