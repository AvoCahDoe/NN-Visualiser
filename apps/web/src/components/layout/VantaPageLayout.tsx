import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VantaPageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function VantaPageLayout({ children, className }: VantaPageLayoutProps) {
  return (
    <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
      <div className={cn('min-w-0 bg-background px-4 sm:px-6', className)}>{children}</div>
      <div className="hidden min-h-full lg:block" aria-hidden />
    </div>
  );
}
