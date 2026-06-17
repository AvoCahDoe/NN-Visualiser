import {
  Link2,
  Network,
  Trash2,
  LayoutGrid,
  Layers,
  Circle,
  LayoutList,
  Grid3x3,
  Copy,
  ClipboardPaste,
} from 'lucide-react';
import { LAYER_TYPE_LABELS, type LayerType } from '@nnviz/shared';
import { useNetworkStore } from '@/store/networkStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LAYER_ICONS } from '@/lib/layerIcons';

const ADDABLE_LAYERS: LayerType[] = ['dense', 'conv2d', 'maxpool2d', 'flatten', 'dropout', 'output'];

export function Toolbar() {
  const addLayer = useNetworkStore((s) => s.addLayer);
  const removeLayer = useNetworkStore((s) => s.removeLayer);
  const selectedLayerId = useNetworkStore((s) => s.selectedLayerId);
  const connectMode = useNetworkStore((s) => s.connectMode);
  const fullyConnectedMode = useNetworkStore((s) => s.fullyConnectedMode);
  const viewMode = useNetworkStore((s) => s.viewMode);
  const showParamMatrices = useNetworkStore((s) => s.showParamMatrices);
  const clipboardLayer = useNetworkStore((s) => s.clipboardLayer);
  const toggleConnectMode = useNetworkStore((s) => s.toggleConnectMode);
  const toggleFullyConnectedMode = useNetworkStore((s) => s.toggleFullyConnectedMode);
  const fullyConnectLayers = useNetworkStore((s) => s.fullyConnectLayers);
  const autoLayout = useNetworkStore((s) => s.autoLayout);
  const setViewMode = useNetworkStore((s) => s.setViewMode);
  const toggleShowParamMatrices = useNetworkStore((s) => s.toggleShowParamMatrices);
  const copySelectedLayer = useNetworkStore((s) => s.copySelectedLayer);
  const pasteLayer = useNetworkStore((s) => s.pasteLayer);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-2">
      <div className="mr-1 flex items-center gap-1.5">
        <Layers size={16} className="text-primary" />
        <span className="text-sm font-medium">Layers</span>
      </div>

      {ADDABLE_LAYERS.map((type) => {
        const Icon = LAYER_ICONS[type];
        return (
          <Button
            key={type}
            variant="secondary"
            size="sm"
            onClick={() => addLayer(type)}
            title={`Add ${LAYER_TYPE_LABELS[type]}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {LAYER_TYPE_LABELS[type]}
          </Button>
        );
      })}

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        variant={viewMode === 'compact' ? 'default' : 'secondary'}
        size="sm"
        onClick={() => setViewMode('compact')}
        title="Compact layer view"
      >
        <LayoutList className="h-3.5 w-3.5" />
        Compact
      </Button>
      <Button
        variant={viewMode === 'nodes' ? 'default' : 'secondary'}
        size="sm"
        onClick={() => setViewMode('nodes')}
        title="Neuron node view"
      >
        <Circle className="h-3.5 w-3.5" />
        Nodes
      </Button>
      <Button
        variant={showParamMatrices ? 'default' : 'secondary'}
        size="sm"
        onClick={toggleShowParamMatrices}
        title="Show weight matrices on connections"
      >
        <Grid3x3 className="h-3.5 w-3.5" />
        Matrices
      </Button>

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        variant={connectMode ? 'default' : 'secondary'}
        size="sm"
        onClick={toggleConnectMode}
      >
        <Link2 size={14} />
        {connectMode ? 'Cancel' : 'Connect'}
      </Button>

      <Button
        variant={fullyConnectedMode ? 'default' : 'secondary'}
        size="sm"
        onClick={toggleFullyConnectedMode}
      >
        <Network size={14} />
        {fullyConnectedMode ? 'Cancel FC' : 'Fully Connected'}
      </Button>

      {fullyConnectedMode && (
        <Button variant="outline" size="sm" onClick={fullyConnectLayers}>
          Create FC
        </Button>
      )}

      <Button variant="secondary" size="sm" onClick={autoLayout}>
        <LayoutGrid size={14} />
        Auto Layout
      </Button>

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        variant="secondary"
        size="sm"
        onClick={copySelectedLayer}
        disabled={!selectedLayerId}
        title="Ctrl+C"
      >
        <Copy size={14} />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={pasteLayer}
        disabled={!clipboardLayer}
        title="Ctrl+V"
      >
        <ClipboardPaste size={14} />
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => selectedLayerId && removeLayer(selectedLayerId)}
        disabled={!selectedLayerId}
        title="Delete / Backspace"
        className={cn(!selectedLayerId && 'opacity-40')}
      >
        <Trash2 size={14} />
      </Button>

      <span className="ml-auto hidden text-[10px] text-muted-foreground lg:inline">
        Del · Ctrl+C · Ctrl+V
      </span>
    </div>
  );
}
