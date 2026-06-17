import { Link, Outlet, useLocation } from 'react-router-dom';
import { Brain, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { VantaBackground } from '@/components/layout/VantaBackground';

const NAV = [
  { path: '/', label: 'Home' },
  { path: '/editor', label: 'Editor' },
  { path: '/demo', label: 'Training Demo' },
  { path: '/docs', label: 'Docs' },
] as const;

export function AppShell() {
  const location = useLocation();
  const isEditor = location.pathname.startsWith('/editor');
  const showVanta = !isEditor;

  return (
    <div className="relative flex min-h-screen flex-col text-foreground">
      {showVanta && <VantaBackground />}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <span className="font-display text-base font-bold tracking-tight">NN Visualizer</span>
              <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                Neural network architecture lab
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <nav className="hidden items-center gap-0.5 sm:flex">
              {NAV.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    location.pathname === path
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <span className="hidden items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground lg:inline-flex">
              <HardDrive className="h-3 w-3" />
              Browser storage
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className={cn('relative z-10 flex-1', isEditor && 'flex flex-col overflow-hidden bg-background')}>
        <Outlet />
      </main>
      {showVanta && <SiteFooter />}
    </div>
  );
}
