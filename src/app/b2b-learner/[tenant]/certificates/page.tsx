'use client';

import { Info } from 'lucide-react';
import { useB2BLearner } from '@/context/B2BLearnerContext';
import { B2BAuthGuard } from '@/components/shared/B2BAuthGuard';
import B2BNavbar from '@/components/layout/B2BNavbar';
import CertificateTabsContent from '@/components/certificates/CertificateTabsContent';

function CertificatesContent() {
  useB2BLearner();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Certificates</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your certificates and assessment report</p>
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Pass any assessment with <strong>60% or higher</strong> to show here. Your best attempt counts.
        </p>
      </div>

      <CertificateTabsContent />
    </div>
  );
}

export default function B2bCertificatesPage() {
  return (
    <B2BAuthGuard>
      <B2BNavbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <CertificatesContent />
      </main>
    </B2BAuthGuard>
  );
}
