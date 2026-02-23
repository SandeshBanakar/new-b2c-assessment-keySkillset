import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={cn('max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8', className)}>
      {children}
    </div>
  );
}
