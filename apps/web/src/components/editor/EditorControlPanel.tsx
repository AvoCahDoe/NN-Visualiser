import { useRef, useState } from 'react';
import {
  Circle,
  Copy,
  ClipboardPaste,
  Code2,
  Download,
  Eye,
  FileJson,
  GitBranch,
  Grid3x3,
  Layers,
  LayoutGrid,
  LayoutList,
  Link2,
  Network,
  Trash2,
  Upload,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { LAYER_TYPE_LABELS, NetworkArchitectureSchema, type LayerType } from '@nnviz/shared';
import { useNetworkStore } from '@/store/networkStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LAYER_ICONS, getLayerDisplayName } from '@/lib/layerIcons';
import { PanelSection } from './PanelSection';
import { PyTorchPreviewDialog } from './PyTorchPreviewDialog';

const ADDABLE_LAYERS: LayerType[] = ['dense', 'conv2d', 'maxpool2d', 'flatten', 'dropout', 'output'];

const EXAMPLES = [
  { name: 'Simple MLP', path: '/examples/simple-mlp.json' },
  { name: 'MNIST CNN', path: '/examples/mnist-cnn.json' },
];

export function EditorControlPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pytorchOpen, setPytorchOpen] = useState(false);
  const architecture = useNetworkStore((s) => s.getActiveArchitecture());
  const selectedLayerId = useNetworkStore((s) => s.selectedLayerId);
  const connectMode = useNetworkStore((s) => s.connectMode);
  const fullyConnectedMode = useNetworkStore((s) => s.fullyConnectedMode);
  const viewMode = useNetworkStore((s) => s.viewMode);
  const showParamMatrices = useNetworkStore((s) => s.showParamMatrices);
  const clipboardLayer = useNetworkStore((s) => s.clipboardLayer);
  const addLayer = useNetworkStore((s) => s.addLayer);
  const removeLayer = useNetworkStore((s) => s.removeLayer);
  const importProject = useNetworkStore((s) => s.importProject);
  const toggleConnectMode = useNetworkStore((s) => s.toggleConnectMode);
  const toggleFullyConnectedMode = useNetworkStore((s) => s.toggleFullyConnectedMode);
  const fullyConnectLayers = useNetworkStore((s) => s.fullyConnectLayers);
  const autoLayout = useNetworkStore((s) => s.autoLayout);
  const setViewMode = useNetworkStore((s) => s.setViewMode);
  const toggleShowParamMatrices = useNetworkStore((s) => s.toggleShowParamMatrices);
  const copySelectedLayer = useNetworkStore((s) => s.copySelectedLayer);
  const pasteLayer = useNetworkStore((s) => s.pasteLayer);
  const setSelectedLayerId = useNetworkStore((s) => s.setSelectedLayerId);

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
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
      {architecture && (
        <div className="border-b border-border px-3 py-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Project</p>
          <p className="truncate font-display text-sm font-semibold">{architecture.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{architecture.layers.length} layers</p>
        </div>
      )}

      <PanelSection
        title="Layers"
        icon={<Layers className="h-3.5 w-3.5" />}
        defaultOpen={false}
        badge={architecture ? `${architecture.layers.length}` : undefined}
      >
        {architecture && (
          <div className="mb-2 max-h-36 space-y-0.5 overflow-y-auto rounded-md border border-border bg-muted/20 p-1">
            {architecture.layers.map((layer) => {
              const Icon = LAYER_ICONS[layer.type];
              const isSelected = layer.id === selectedLayerId;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors',
                    isSelected
                      ? 'bg-primary/15 text-primary'
                      : 'text-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{getLayerDisplayName(layer.type, layer.name)}</span>
                </button>
              );
            })}
          </div>
        )}
        <p className="mb-1.5 text-[10px] text-muted-foreground">Add layer</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ADDABLE_LAYERS.map((type) => {
            const Icon = LAYER_ICONS[type];
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-1 px-2 py-2 text-[10px]"
                onClick={() => addLayer(type)}
                title={`Add ${LAYER_TYPE_LABELS[type]}`}
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="leading-tight">{LAYER_TYPE_LABELS[type]}</span>
              </Button>
            );
          })}
        </div>
      </PanelSection>

      <PanelSection title="View" icon={<Eye className="h-3.5 w-3.5" />}>
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('compact')}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Compact
            </Button>
            <Button
              variant={viewMode === 'nodes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('nodes')}
            >
              <Circle className="h-3.5 w-3.5" />
              Nodes
            </Button>
          </div>
          <Button
            variant={showParamMatrices ? 'default' : 'outline'}
            size="sm"
            className="w-full"
            onClick={toggleShowParamMatrices}
          >
            <Grid3x3 className="h-3.5 w-3.5" />
            Weight matrices
          </Button>
        </div>
      </PanelSection>

      <PanelSection title="Graph" icon={<GitBranch className="h-3.5 w-3.5" />}>
        <div className="flex flex-col gap-1.5">
          <Button
            variant={connectMode ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-start"
            onClick={toggleConnectMode}
          >
            <Link2 className="h-3.5 w-3.5" />
            {connectMode ? 'Cancel connect' : 'Connect layers'}
          </Button>
          <Button
            variant={fullyConnectedMode ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-start"
            onClick={toggleFullyConnectedMode}
          >
            <Network className="h-3.5 w-3.5" />
            {fullyConnectedMode ? 'Cancel FC mode' : 'Fully connected'}
          </Button>
          {fullyConnectedMode && (
            <Button variant="secondary" size="sm" className="w-full" onClick={fullyConnectLayers}>
              Create connections
            </Button>
          )}
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={autoLayout}>
            <LayoutGrid className="h-3.5 w-3.5" />
            Auto layout
          </Button>
        </div>
      </PanelSection>

      <PanelSection title="Edit" icon={<Copy className="h-3.5 w-3.5" />}>
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={copySelectedLayer}
            disabled={!selectedLayerId}
            title="Ctrl+C"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => pasteLayer()}
            disabled={!clipboardLayer}
            title="Ctrl+V"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => selectedLayerId && removeLayer(selectedLayerId)}
            disabled={!selectedLayerId}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Del · Ctrl+C · Ctrl+V</p>
      </PanelSection>

      <PanelSection title="File" icon={<FolderOpen className="h-3.5 w-3.5" />}>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => setPytorchOpen(true)}
            disabled={!architecture}
          >
            <Code2 className="h-4 w-4" />
            Preview PyTorch
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={handleExport}
            disabled={!architecture}
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="ghost" size="sm" className="justify-start" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import JSON
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
      </PanelSection>

      <PanelSection title="Templates" icon={<FileJson className="h-3.5 w-3.5" />}>
        <div className="flex flex-col gap-1">
          {EXAMPLES.map((ex) => (
            <Button
              key={ex.path}
              variant="ghost"
              size="sm"
              className={cn('justify-start text-xs')}
              onClick={() => loadExample(ex.path)}
            >
              <FileJson className="h-3.5 w-3.5" />
              {ex.name}
            </Button>
          ))}
        </div>
      </PanelSection>

      <PyTorchPreviewDialog
        architecture={architecture}
        open={pytorchOpen}
        onClose={() => setPytorchOpen(false)}
      />
    </aside>
  );
}
