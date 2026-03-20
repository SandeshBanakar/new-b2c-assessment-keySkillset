import { redirect } from 'next/navigation'

export default async function ClientAdminRoot({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params
  redirect(`/client-admin/${tenant}/dashboard`)
}
