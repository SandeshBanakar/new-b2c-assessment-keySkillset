import { redirect } from 'next/navigation'

export default function ClientAdminRoot({
  params,
}: {
  params: { tenant: string }
}) {
  redirect(`/client-admin/${params.tenant}/dashboard`)
}
