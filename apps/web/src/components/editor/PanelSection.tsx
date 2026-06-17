import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanelSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  badge?: string;
}

export function PanelSection({
  title,
  icon,
  children,
  className,
  defaultOpen = true,
  badge,
}: PanelSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn('border-b border-border last:border-b-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2 text-left transition-colors hover:bg-muted/60"
      >
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {badge && !open && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {badge}
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className="p-2">{children}</div>}
    </section>
  );
}
