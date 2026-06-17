import { useRef } from 'react';
import { Download, Upload, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import { NetworkArchitectureSchema } from '@nnviz/shared';
import { useNetworkStore } from '@/store/networkStore';
import { Button } from '@/components/ui/button';

const EXAMPLES = [
  { name: 'Simple MLP', path: '/examples/simple-mlp.json' },
  { name: 'MNIST CNN', path: '/examples/mnist-cnn.json' },
];

export function EditorSidebar() {
  const fileRef = useRef<HTMLInputElement>(null);
  const architecture = useNetworkStore((s) => s.getActiveArchitecture());
  const importProject = useNetworkStore((s) => s.importProject);

  const handleExport = () => {
    if (!architecture) return;
    const blob = new Blob([JSON.stringify(architecture, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${architecture.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Architecture exported');
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = NetworkArchitectureSchema.safeParse(json);
      if (!parsed.success) {
        toast.error('Invalid architecture file');
        return;
      }
      importProject(parsed.data);
      toast.success('Architecture imported');
    } catch {
      toast.error('Failed to parse JSON file');
    }
  };

  const loadExample = async (path: string) => {
    try {
      const res = await fetch(path);
      const json = await res.json();
      const parsed = NetworkArchitectureSchema.safeParse(json);
      if (!parsed.success) {
        toast.error('Invalid example file');
        return;
      }
      importProject(parsed.data);
      toast.success('Example loaded');
    } catch {
      toast.error('Failed to load example');
    }
  };

  return (
    <aside className="flex w-44 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">File</p>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={handleExport}
          disabled={!architecture}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="ghost" size="sm" className="justify-start" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Import
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
            e.target.value = '';
          }}
        />
      </div>
      <div className="border-t border-border p-2">
        <p className="px-2 py-1 text-xs font-medium uppercase text-muted-foreground">Examples</p>
        {EXAMPLES.map((ex) => (
          <Button
            key={ex.path}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => loadExample(ex.path)}
          >
            <FileJson className="h-4 w-4" />
            {ex.name}
          </Button>
        ))}
      </div>
    </aside>
  );
}
