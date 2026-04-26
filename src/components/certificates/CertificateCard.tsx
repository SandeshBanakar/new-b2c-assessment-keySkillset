"use client";

import React from 'react';
import { Download, Award, Clock } from 'lucide-react';

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
  attempt,
  onDownload,
}: {
  certificate: Certificate;
  attempt?: { score_pct?: number; passed?: boolean; attempted_at?: string } | null;
  onDownload?: (id: string) => void;
}) {
  const type = certificate.content_type ?? 'COURSE';
  const gradient = type === 'ASSESSMENT' ? 'from-blue-100 to-blue-200' : 'from-emerald-100 to-emerald-200';

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
      <div className={`h-2 bg-linear-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center shrink-0`}>
            <Award className="w-5 h-5 text-zinc-700" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 truncate">{certificate.content_title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium">{type}</span>
              {certificate.certificate_number && (
                <span className="text-xs text-zinc-400">{certificate.certificate_number}</span>
              )}
            </div>
          </div>

          <div className="ml-auto flex flex-col items-end gap-2">
            {attempt ? (
              <div className="text-right">
                <div className={`text-sm font-semibold ${attempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {attempt.score_pct ?? '—'}%
                </div>
                {attempt.attempted_at && (
                  <div className="text-xs text-zinc-400 mt-1">
                    <Clock className="inline-block w-3 h-3 mr-1" />
                    {new Date(attempt.attempted_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-400">Issued: {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : '—'}</div>
            )}

            <button
              onClick={() => onDownload && onDownload(certificate.id)}
              className="inline-flex items-center gap-2 text-sm text-teal-700 hover:text-teal-800"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
