import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Toolbar } from '@/components/Toolbar';
import { NetworkCanvas } from '@/components/NetworkCanvas';
import { LayerInspector } from '@/components/LayerInspector';
import { EditorSidebar } from '@/components/EditorSidebar';

export function EditorPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
      </div>
      <div className="flex min-h-0 flex-1">
        <EditorSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Toolbar />
          <div className="min-h-0 flex-1">
            <NetworkCanvas />
          </div>
        </div>
        <LayerInspector />
      </div>
    </div>
  );
}
