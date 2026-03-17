import type { PlanDetail } from '@/lib/supabase/plans'

type Props = { plan: PlanDetail }

const MOCK_SUBSCRIBERS = [
  { name: 'Arjun Mehta',  email: 'arjun.m@gmail.com',   joined: 'Jan 12, 2026' },
  { name: 'Priya Sharma', email: 'priya.s@gmail.com',   joined: 'Jan 28, 2026' },
  { name: 'Rahul Verma',  email: 'rahul.v@outlook.com', joined: 'Feb 3, 2026' },
  { name: 'Sneha Nair',   email: 'sneha.n@gmail.com',   joined: 'Feb 14, 2026' },
  { name: 'Karan Patel',  email: 'karan.p@yahoo.com',   joined: 'Mar 1, 2026' },
]

export function PlanSubscribersTab({ plan }: Props) {
  const count = plan.plan_subscribers?.subscriber_count ?? 0
  const mrr   = plan.plan_subscribers?.mock_mrr ?? 0

  return (
    <div className="space-y-5">

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-md px-4 py-3">
          <p className="text-xs text-zinc-400">Total subscribers</p>
          <p className="text-lg font-semibold text-zinc-900 mt-0.5">
            {count.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-md px-4 py-3">
          <p className="text-xs text-zinc-400">MRR</p>
          <p className="text-lg font-semibold text-zinc-900 mt-0.5">
            ₹{mrr.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Subscriber table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {MOCK_SUBSCRIBERS.map((s) => (
              <tr key={s.email} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                <td className="px-4 py-3 text-zinc-500">{s.email}</td>
                <td className="px-4 py-3 text-zinc-500">{s.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs text-zinc-400">
            Showing 5 of {count} subscribers — Demo data, live figures in production
          </p>
        </div>
      </div>

    </div>
  )
}
