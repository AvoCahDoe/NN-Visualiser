import type { Activation, LayerConfig, NetworkArchitecture } from '@nnviz/shared';
import { computeShapeChain } from './shapes.js';

function getNumParam(params: Record<string, number | string>, key: string, fallback: number): number {
  const val = params[key];
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function flatDim(shape: number[]): number {
  return shape.reduce((a, b) => a * b, 1);
}

function toClassName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const base = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('') || 'Network';
  return /^\d/.test(base) ? `Model${base}` : base;
}

function toVarName(layer: LayerConfig, counters: Record<string, number>): string {
  const base = (layer.name ?? layer.type)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || layer.type;
  counters[base] = (counters[base] ?? 0) + 1;
  const count = counters[base];
  return count > 1 ? `${base}_${count}` : base;
}

function convPaddingExpr(
  padding: number | string,
  kernelSize: number,
  stride: number,
): string {
  if (padding === 'same') {
    if (stride === 1) return String(Math.floor(kernelSize / 2));
    return `'same'`;
  }
  if (padding === 'valid') return '0';
  return String(padding);
}

function activationCall(activation: Activation | undefined, expr: string): string {
  switch (activation) {
    case 'relu':
      return `F.relu(${expr})`;
    case 'sigmoid':
      return `torch.sigmoid(${expr})`;
    case 'tanh':
      return `torch.tanh(${expr})`;
    case 'softmax':
      return `F.softmax(${expr}, dim=1)`;
    case 'linear':
    default:
      return expr;
  }
}

function formatInputShapeComment(shape: number[]): string {
  if (shape.length === 1) {
    return `(batch_size, ${shape[0]})`;
  }
  if (shape.length === 3) {
    const [h, w, c] = shape;
    return `(batch_size, ${c}, ${h}, ${w})  # channels-first (NCHW)`;
  }
  return `(batch_size, ${shape.join(', ')})`;
}

function inferInChannels(prevShape: number[], inputShape: number[]): number {
  if (prevShape.length === 3) return prevShape[2];
  if (prevShape.length === 1 && inputShape.length === 3) return inputShape[2];
  return 1;
}

export function generatePyTorchCode(architecture: NetworkArchitecture): string {
  const className = toClassName(architecture.name);
  const shapes = computeShapeChain(architecture);
  const counters: Record<string, number> = {};
  const initLines: string[] = [];
  const forwardLines: string[] = [];
  const moduleByLayerId = new Map<string, string>();

  for (let i = 0; i < architecture.layers.length; i++) {
    const layer = architecture.layers[i];
    if (layer.type === 'input') continue;

    const varName = toVarName(layer, counters);
    moduleByLayerId.set(layer.id, varName);
    const prevShape = shapes[i - 1]?.outputShape ?? architecture.inputShape;

    switch (layer.type) {
      case 'dense': {
        const units = getNumParam(layer.params, 'units', 64);
        const inFeatures = flatDim(prevShape);
        initLines.push(`        self.${varName} = nn.Linear(${inFeatures}, ${units})`);
        forwardLines.push(`        x = ${activationCall(layer.activation, `self.${varName}(x)`)}`);
        break;
      }
      case 'output': {
        const units = getNumParam(layer.params, 'units', 10);
        const inFeatures = flatDim(prevShape);
        initLines.push(`        self.${varName} = nn.Linear(${inFeatures}, ${units})`);
        const outExpr = `self.${varName}(x)`;
        forwardLines.push(
          layer.activation === 'softmax'
            ? `        x = ${activationCall('softmax', outExpr)}`
            : `        x = ${activationCall(layer.activation ?? 'linear', outExpr)}`,
        );
        break;
      }
      case 'conv2d': {
        const filters = getNumParam(layer.params, 'filters', 32);
        const kernelSize = getNumParam(layer.params, 'kernelSize', 3);
        const stride = getNumParam(layer.params, 'stride', 1);
        const padding = layer.params.padding ?? 'same';
        const inChannels = inferInChannels(prevShape, architecture.inputShape);
        const pad = convPaddingExpr(padding, kernelSize, stride);
        initLines.push(
          `        self.${varName} = nn.Conv2d(${inChannels}, ${filters}, kernel_size=${kernelSize}, stride=${stride}, padding=${pad})`,
        );
        forwardLines.push(`        x = ${activationCall(layer.activation ?? 'relu', `self.${varName}(x)`)}`);
        break;
      }
      case 'maxpool2d': {
        const poolSize = getNumParam(layer.params, 'poolSize', 2);
        const stride = getNumParam(layer.params, 'stride', 2);
        initLines.push(
          `        self.${varName} = nn.MaxPool2d(kernel_size=${poolSize}, stride=${stride})`,
        );
        forwardLines.push(`        x = self.${varName}(x)`);
        break;
      }
      case 'flatten':
        initLines.push(`        self.${varName} = nn.Flatten()`);
        forwardLines.push(`        x = self.${varName}(x)`);
        break;
      case 'dropout': {
        const rate = getNumParam(layer.params, 'rate', 0.5);
        initLines.push(`        self.${varName} = nn.Dropout(p=${rate})`);
        forwardLines.push(`        x = self.${varName}(x)`);
        break;
      }
      default:
        break;
    }
  }

  const inputComment = formatInputShapeComment(architecture.inputShape);
  const hasConv = architecture.layers.some((l) => l.type === 'conv2d' || l.type === 'maxpool2d');
  const reshapeNote =
    architecture.inputShape.length === 3 && hasConv
      ? '\n        # Reshape HWC flat inputs to NCHW if needed:\n        # x = x.view(x.size(0), -1).reshape(x.size(0), H, W, C).permute(0, 3, 1, 2)'
      : architecture.inputShape.length === 3 && !hasConv
        ? '\n        # x = x.view(x.size(0), -1)  # flatten spatial dims if input is HWC'
        : '';

  const forwardBody =
    forwardLines.length > 0
      ? forwardLines.join('\n')
      : '        pass  # no compute layers defined';

  return `import torch
import torch.nn as nn
import torch.nn.functional as F


class ${className}(nn.Module):
    """Generated from NN Visualizer architecture: ${architecture.name.replace(/"/g, '\\"')}"""

    def __init__(self):
        super().__init__()
${initLines.length > 0 ? initLines.join('\n') : '        pass  # no layers defined'}

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Expected input shape: ${inputComment}${reshapeNote}
${forwardBody}
        return x


if __name__ == "__main__":
    model = ${className}()
    # Example forward pass (adjust batch size / shape to your data)
    example = torch.randn(1, ${architecture.inputShape.length === 3 ? `${architecture.inputShape[2]}, ${architecture.inputShape[0]}, ${architecture.inputShape[1]}` : architecture.inputShape.join(', ')})
    with torch.no_grad():
        out = model(example)
    print(out.shape)
`;
}
