'use client';

import { Eye } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export default function PreviewSectionWrapper({ children }: Props) {
  return (
    <div className="relative">
      {children}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2.5 py-1 text-xs font-medium pointer-events-none select-none">
        <Eye className="w-3 h-3" />
        Preview
      </div>
    </div>
  );
}
