import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { LayerType } from '@nnviz/shared';
import {
  DEFAULT_LAYER_ICON,
  LAYER_ICONS,
} from '@/lib/layerIcons';

export type CanvasViewMode = 'compact' | 'nodes';

export interface LayerNodeData {
  layerType: LayerType;
  layerId: string;
  displayName: string;
  nodeCount?: number;
  selected?: boolean;
  outputShape?: string;
  viewMode: CanvasViewMode;
  neuronCount: number;
  [key: string]: unknown;
}

const TYPE_COLORS: Record<LayerType, string> = {
  input: '#6366a8',
  dense: '#22d3ee',
  conv2d: '#a78bfa',
  maxpool2d: '#34d399',
  flatten: '#fbbf24',
  dropout: '#94a3b8',
  output: '#f87171',
};

function NeuronStack({ count, color }: { count: number; color: string }) {
  const visible = Math.min(count, 10);
  const extra = count - visible;

  return (
    <div className="mt-2 flex flex-col items-center gap-1">
      {Array.from({ length: visible }, (_, i) => (
        <div
          key={i}
          className="h-3 w-3 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: `${color}40`, borderColor: color }}
        />
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-muted-foreground">+{extra} more</span>
      )}
    </div>
  );
}

function LayerNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as LayerNodeData;
  const color = TYPE_COLORS[nodeData.layerType] ?? '#6366a8';
  const Icon = LAYER_ICONS[nodeData.layerType] ?? DEFAULT_LAYER_ICON;
  const isNodes = nodeData.viewMode === 'nodes';

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-t-[3px] bg-card shadow-sm transition-all',
        isNodes ? 'min-w-[100px] px-3 py-3' : 'min-w-[130px] px-3 py-2',
        selected || nodeData.selected ? 'border-primary ring-2 ring-primary/30' : 'border-border',
      )}
      style={{ borderTopColor: color }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-primary" />

      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">
            {nodeData.displayName}
          </div>
          {!isNodes && nodeData.outputShape && (
            <div className="mt-0.5 font-mono text-[10px] text-primary">{nodeData.outputShape}</div>
          )}
        </div>
      </div>

      {isNodes ? (
        <NeuronStack count={nodeData.neuronCount} color={color} />
      ) : (
        nodeData.nodeCount != null &&
        nodeData.nodeCount > 1 && (
          <div className="mt-1.5 text-xs text-muted-foreground">{nodeData.nodeCount} units</div>
        )
      )}

      {isNodes && nodeData.outputShape && (
        <div className="mt-2 text-center font-mono text-[10px] text-primary">{nodeData.outputShape}</div>
      )}

      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-primary" />
    </div>
  );
}

export const LayerNode = memo(LayerNodeComponent);
