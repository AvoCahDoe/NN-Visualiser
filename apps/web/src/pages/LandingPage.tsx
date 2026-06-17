import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Calculator,
  Download,
  FileJson,
  FolderOpen,
  Layers,
  Network,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { NetworkArchitectureSchema } from '@nnviz/shared';
import { useNetworkStore } from '@/store/networkStore';
import { backupProjects, loadProjectsBackup } from '@/lib/storage';
import { VantaPageLayout } from '@/components/layout/VantaPageLayout';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Network,
    title: 'Visual editor',
    description: 'Build layer graphs with drag-and-drop and live connections.',
  },
  {
    icon: Calculator,
    title: 'Shape math',
    description: 'Output dimensions, parameter counts, and KaTeX formulas.',
  },
  {
    icon: Download,
    title: 'Export JSON',
    description: 'Save architectures locally and import templates anytime.',
  },
];

const EXAMPLES = [
  { name: 'Simple MLP', path: '/examples/simple-mlp.json' },
  { name: 'MNIST CNN', path: '/examples/mnist-cnn.json' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const projects = useNetworkStore((s) => s.projects);
  const createProject = useNetworkStore((s) => s.createProject);
  const switchProject = useNetworkStore((s) => s.switchProject);
  const deleteProject = useNetworkStore((s) => s.deleteProject);
  const importProject = useNetworkStore((s) => s.importProject);

  useEffect(() => {
    if (projects.length === 0) {
      loadProjectsBackup().then((backup) => {
        if (backup && backup.length > 0) {
          backup.forEach((p) => importProject(p.architecture));
        }
      });
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      backupProjects(projects).catch(() => {});
    }
  }, [projects]);

  const openProject = (id: string) => {
    switchProject(id);
    navigate('/editor');
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
      navigate('/editor');
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
      navigate('/editor');
    } catch {
      toast.error('Failed to load example');
    }
  };

  return (
    <VantaPageLayout>
      <section className="border-b border-border py-12 sm:py-16">
        <p className="mb-3 text-sm font-medium text-primary">Interactive architecture lab</p>
        <h1 className="font-display max-w-xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Design and visualize neural networks
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          Compose layers, inspect output shapes, step through training math, and export
          architectures — all in your browser.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => { createProject(); navigate('/editor'); }}>
            <Sparkles className="h-4 w-4" />
            New network
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/demo')}>
            <Brain className="h-4 w-4" />
            Training demo
          </Button>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Your projects
            </h2>
            <p className="mt-1 text-muted-foreground">
              Open a saved network or start from a template.
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0"
            onClick={() => { createProject(); navigate('/editor'); }}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No projects yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Create a network or load an example template to get started.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((ex) => (
                <Button key={ex.path} variant="outline" onClick={() => loadExample(ex.path)}>
                  <FileJson className="h-4 w-4" />
                  {ex.name}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className="group rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                onClick={() => openProject(p.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-base font-semibold text-foreground group-hover:text-primary">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(p.updatedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(p.id);
                      toast.success('Project deleted');
                    }}
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  {p.architecture.layers.length} layers
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import JSON
          </Button>
          {EXAMPLES.map((ex) => (
            <Button key={ex.path} variant="ghost" size="sm" onClick={() => loadExample(ex.path)}>
              <FileJson className="h-4 w-4" />
              {ex.name}
            </Button>
          ))}
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
      </section>
    </VantaPageLayout>
  );
}
