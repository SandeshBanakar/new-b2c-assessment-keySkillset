"use client";

import { Download, Award } from 'lucide-react';

interface Certificate {
  id: string;
  content_id: string;
  content_title: string;
  certificate_number?: string | null;
  issued_at?: string | null;
  content_type?: string | null;
}

export default function CertificateCard({
  certificate,
  onDownload,
}: {
  certificate: Certificate;
  onDownload?: (id: string) => void;
}) {
  const type = certificate.content_type ?? 'COURSE';
  const isAssessment = type === 'ASSESSMENT';
  const accentStyle = isAssessment
    ? { background: 'linear-gradient(to right, #bfdbfe, #93c5fd)' }
    : { background: 'linear-gradient(to right, #a7f3d0, #6ee7b7)' };
  const iconBg = isAssessment ? 'bg-blue-100' : 'bg-emerald-100';
  const iconColor = isAssessment ? 'text-blue-700' : 'text-emerald-700';
  const badgeClass = isAssessment
    ? 'bg-blue-50 text-blue-700 border border-blue-200'
    : 'bg-emerald-50 text-emerald-700 border border-emerald-200';

  const issuedDate = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col">
      {/* Colored top bar */}
      <div className="h-2 shrink-0" style={accentStyle} />

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
            <Award className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-2">
              {certificate.content_title}
            </h3>
            <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
              {type}
            </span>
          </div>
        </div>

        {/* Certificate number */}
        {certificate.certificate_number && (
          <p className="text-xs text-zinc-400 font-mono truncate">
            {certificate.certificate_number}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {issuedDate ? `Issued: ${issuedDate}` : 'Pending'}
        </span>
        <button
          onClick={() => onDownload?.(certificate.id)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}
