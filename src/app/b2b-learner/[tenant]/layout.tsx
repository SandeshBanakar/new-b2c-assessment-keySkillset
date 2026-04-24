import { B2BLearnerProvider } from '@/context/B2BLearnerContext';

export default async function B2BLearnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return (
    <B2BLearnerProvider tenantSlug={tenant}>
      {children}
    </B2BLearnerProvider>
  );
}
