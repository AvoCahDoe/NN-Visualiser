import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownToLine,
  Box,
  CircleDot,
  Filter,
  Grid3x3,
  Layers,
  Maximize2,
  ScanLine,
} from 'lucide-react';
import { LAYER_TYPE_LABELS, type LayerType } from '@nnviz/shared';

export const LAYER_ICONS: Record<LayerType, LucideIcon> = {
  input: ScanLine,
  dense: Grid3x3,
  conv2d: Filter,
  maxpool2d: Maximize2,
  flatten: Layers,
  dropout: CircleDot,
  output: ArrowDownToLine,
};

export function getLayerDisplayName(type: LayerType, name?: string): string {
  return name?.trim() || LAYER_TYPE_LABELS[type];
}

export function getNeuronCount(
  type: LayerType,
  params: Record<string, number | string>,
  nodeCount?: number,
  inputShape?: number[],
): number {
  if (nodeCount && nodeCount > 0) return nodeCount;
  if (type === 'dense' || type === 'output') {
    const units = Number(params.units);
    return Number.isFinite(units) && units > 0 ? units : 4;
  }
  if (type === 'input' && inputShape?.length) {
    return Math.min(Math.max(inputShape.reduce((a, b) => a * b, 1), 1), 16);
  }
  if (type === 'conv2d') {
    const filters = Number(params.filters);
    return Number.isFinite(filters) && filters > 0 ? Math.min(filters, 16) : 4;
  }
  return 1;
}

/** Fallback icon for unknown */
export const DEFAULT_LAYER_ICON: LucideIcon = Box;
