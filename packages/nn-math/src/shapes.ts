import type { LayerConfig, LayerType, NetworkArchitecture, ShapeResult } from '@nnviz/shared';

function getNumParam(params: Record<string, number | string>, key: string, fallback: number): number {
  const val = params[key];
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function convOutputSize(
  inputSize: number,
  kernelSize: number,
  stride: number,
  padding: number | 'same' | 'valid',
): number {
  if (padding === 'same') {
    return Math.ceil(inputSize / stride);
  }
  if (padding === 'valid') {
    return Math.floor((inputSize - kernelSize) / stride) + 1;
  }
  return Math.floor((inputSize + 2 * padding - kernelSize) / stride) + 1;
}

function computeLayerShape(
  layer: LayerConfig,
  inputShape: number[],
): { outputShape: number[]; paramCount: number; formula?: string } {
  switch (layer.type) {
    case 'input':
      return { outputShape: [...inputShape], paramCount: 0 };

    case 'dense': {
      const units = getNumParam(layer.params, 'units', 64);
      const inputDim = inputShape.reduce((a, b) => a * b, 1);
      return {
        outputShape: [units],
        paramCount: inputDim * units + units,
        formula: `W \\in \\mathbb{R}^{${inputDim} \\times ${units}},\\; b \\in \\mathbb{R}^{${units}}`,
      };
    }

    case 'conv2d': {
      const filters = getNumParam(layer.params, 'filters', 32);
      const kernelSize = getNumParam(layer.params, 'kernelSize', 3);
      const stride = getNumParam(layer.params, 'stride', 1);
      const padding = layer.params.padding ?? 'same';
      const padNum = typeof padding === 'number' ? padding : padding;

      let h: number, w: number, c: number;
      if (inputShape.length === 3) {
        [h, w, c] = inputShape;
      } else if (inputShape.length === 1) {
        const side = Math.round(Math.sqrt(inputShape[0]));
        h = w = side;
        c = 1;
      } else {
        [h, w] = inputShape;
        c = 1;
      }

      const outH = convOutputSize(h, kernelSize, stride, padNum as number | 'same' | 'valid');
      const outW = convOutputSize(w, kernelSize, stride, padNum as number | 'same' | 'valid');
      const params = kernelSize * kernelSize * c * filters + filters;

      return {
        outputShape: [outH, outW, filters],
        paramCount: params,
        formula: `H^{\\prime} = \\left\\lfloor\\frac{H + 2P - K}{S}\\right\\rfloor + 1`,
      };
    }

    case 'maxpool2d': {
      const poolSize = getNumParam(layer.params, 'poolSize', 2);
      const stride = getNumParam(layer.params, 'stride', 2);

      if (inputShape.length === 3) {
        const [h, w, c] = inputShape;
        const outH = Math.floor((h - poolSize) / stride) + 1;
        const outW = Math.floor((w - poolSize) / stride) + 1;
        return {
          outputShape: [outH, outW, c],
          paramCount: 0,
          formula: `H^{\\prime} = \\left\\lfloor\\frac{H - P}{S}\\right\\rfloor + 1`,
        };
      }
      return { outputShape: inputShape, paramCount: 0 };
    }

    case 'flatten': {
      const flat = inputShape.reduce((a, b) => a * b, 1);
      return {
        outputShape: [flat],
        paramCount: 0,
        formula: `\\text{flatten}(${inputShape.join(' \\times ')}) \\rightarrow ${flat}`,
      };
    }

    case 'dropout':
      return { outputShape: [...inputShape], paramCount: 0 };

    case 'output': {
      const units = getNumParam(layer.params, 'units', 10);
      const inputDim = inputShape.reduce((a, b) => a * b, 1);
      return {
        outputShape: [units],
        paramCount: inputDim * units + units,
        formula: `\\text{softmax}(W x + b),\\; W \\in \\mathbb{R}^{${inputDim} \\times ${units}}`,
      };
    }

    default:
      return { outputShape: [...inputShape], paramCount: 0 };
  }
}

export function computeShapeChain(architecture: NetworkArchitecture): ShapeResult[] {
  const results: ShapeResult[] = [];
  let currentShape = [...architecture.inputShape];

  for (const layer of architecture.layers) {
    const { outputShape, paramCount, formula } = computeLayerShape(layer, currentShape);
    results.push({
      layerId: layer.id,
      layerType: layer.type,
      outputShape,
      paramCount,
      formula,
    });
    if (layer.type !== 'input') {
      currentShape = outputShape;
    }
  }

  return results;
}

export function validateArchitecture(architecture: NetworkArchitecture): {
  valid: boolean;
  errors: string[];
  shapes: ShapeResult[];
  totalParams: number;
} {
  const errors: string[] = [];
  const shapes = computeShapeChain(architecture);
  const layerIds = new Set(architecture.layers.map((l) => l.id));

  if (architecture.layers.length === 0) {
    errors.push('Architecture must have at least one layer.');
  }

  const hasInput = architecture.layers.some((l) => l.type === 'input');
  if (!hasInput) {
    errors.push('Architecture must include an input layer.');
  }

  for (const edge of architecture.edges) {
    if (!layerIds.has(edge.from)) {
      errors.push(`Edge references unknown layer: ${edge.from}`);
    }
    if (!layerIds.has(edge.to)) {
      errors.push(`Edge references unknown layer: ${edge.to}`);
    }
  }

  for (let i = 0; i < architecture.layers.length; i++) {
    const layer = architecture.layers[i];
    const prev = architecture.layers[i - 1];

    if (layer.type === 'conv2d' && prev && prev.type === 'dense') {
      errors.push(`Conv2D layer "${layer.id}" cannot follow a Dense layer.`);
    }

    if (layer.type === 'flatten') {
      const prevShape = shapes[i - 1]?.outputShape ?? [];
      if (prevShape.length <= 1) {
        errors.push(`Flatten layer "${layer.id}" requires multi-dimensional input.`);
      }
    }

    if (layer.type === 'maxpool2d') {
      const prevShape = shapes[i - 1]?.outputShape ?? [];
      if (prevShape.length < 3) {
        errors.push(`MaxPool2D layer "${layer.id}" requires 3D input (H, W, C).`);
      }
    }
  }

  const totalParams = shapes.reduce((sum, s) => sum + s.paramCount, 0);

  return { valid: errors.length === 0, errors, shapes, totalParams };
}

export function getLayerFormula(type: LayerType): string {
  const formulas: Record<LayerType, string> = {
    input: 'x \\in \\mathbb{R}^{d}',
    dense: 'y = \\sigma(Wx + b)',
    conv2d: 'y = \\sigma(x \\ast W + b)',
    maxpool2d: 'y_{i,j} = \\max_{(m,n) \\in \\mathcal{R}} x_{i+m,\\, j+n}',
    flatten: 'y = \\mathrm{vec}(x)',
    dropout: 'y = \\frac{x \\odot m}{1-p},\\quad m \\sim \\mathrm{Bernoulli}(1-p)',
    output: 'y = \\mathrm{softmax}(Wx + b)',
  };
  return formulas[type];
}

export function formatShape(shape: number[]): string {
  if (shape.length === 1) return `[${shape[0]}]`;
  return `(${shape.join(', ')})`;
}

function flatDim(shape: number[]): number {
  return shape.reduce((a, b) => a * b, 1);
}

export interface ConnectionMatrixSpec {
  rows: number;
  cols: number;
  label: string;
  paramCount: number;
}

export function getConnectionMatrixSpec(
  fromLayerId: string,
  toLayerId: string,
  shapes: ShapeResult[],
): ConnectionMatrixSpec | null {
  const fromIdx = shapes.findIndex((s) => s.layerId === fromLayerId);
  const toIdx = shapes.findIndex((s) => s.layerId === toLayerId);
  if (fromIdx < 0 || toIdx < 0 || toIdx !== fromIdx + 1) return null;

  const inShape = shapes[fromIdx]?.outputShape ?? [];
  const outShape = shapes[toIdx]?.outputShape ?? [];
  const rows = flatDim(inShape);
  const cols = flatDim(outShape);

  if (rows === 0 || cols === 0) return null;

  const toType = shapes[toIdx]?.layerType;
  let paramCount = rows * cols;
  if (toType === 'dense' || toType === 'output') paramCount += cols;

  return {
    rows,
    cols,
    label: `W \\in \\mathbb{R}^{${rows} \\times ${cols}}`,
    paramCount,
  };
}
