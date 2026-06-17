import { z } from 'zod';
import { generateId } from './id.js';

export const LayerTypeSchema = z.enum([
  'input',
  'dense',
  'conv2d',
  'maxpool2d',
  'flatten',
  'dropout',
  'output',
]);

export const ActivationSchema = z.enum([
  'relu',
  'sigmoid',
  'tanh',
  'softmax',
  'linear',
]);

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const LayerConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  type: LayerTypeSchema,
  params: z.record(z.union([z.number(), z.string()])),
  activation: ActivationSchema.optional(),
  position: PositionSchema,
  nodeCount: z.number().int().min(1).optional(),
});

export const EdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  weight: z.number().optional(),
});

export const MetadataSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const NetworkArchitectureSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  version: z.literal(1),
  inputShape: z.array(z.number().int().positive()).min(1),
  layers: z.array(LayerConfigSchema).min(1),
  edges: z.array(EdgeSchema),
  metadata: MetadataSchema,
});

export const ShapeResultSchema = z.object({
  layerId: z.string(),
  layerType: LayerTypeSchema,
  outputShape: z.array(z.number()),
  paramCount: z.number().int().nonnegative(),
  formula: z.string().optional(),
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  shapes: z.array(ShapeResultSchema),
  totalParams: z.number().int().nonnegative(),
});

export const DemoStepTypeSchema = z.enum([
  'forward',
  'loss',
  'backward',
  'update',
  'complete',
]);

export const DemoStepSchema = z.object({
  type: DemoStepTypeSchema,
  index: z.number().int().nonnegative(),
  title: z.string(),
  description: z.string(),
  formula: z.string().optional(),
  values: z.record(z.unknown()).optional(),
  activations: z.record(z.number()).optional(),
  gradients: z.record(z.number()).optional(),
  weights: z.record(z.number()).optional(),
  loss: z.number().optional(),
});

export const DemoStateSchema = z.object({
  id: z.string(),
  learningRate: z.number().positive(),
  currentStep: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
  steps: z.array(DemoStepSchema),
  network: z.object({
    layers: z.array(z.object({
      id: z.string(),
      units: z.number().int().positive(),
      activation: ActivationSchema,
    })),
    weights: z.record(z.number()),
  }),
});

export type LayerType = z.infer<typeof LayerTypeSchema>;
export type Activation = z.infer<typeof ActivationSchema>;
export type LayerConfig = z.infer<typeof LayerConfigSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type NetworkArchitecture = z.infer<typeof NetworkArchitectureSchema>;
export type ShapeResult = z.infer<typeof ShapeResultSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type DemoStepType = z.infer<typeof DemoStepTypeSchema>;
export type DemoStep = z.infer<typeof DemoStepSchema>;
export type DemoState = z.infer<typeof DemoStateSchema>;

export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  input: 'Input',
  dense: 'Dense',
  conv2d: 'Conv2D',
  maxpool2d: 'Max Pool 2D',
  flatten: 'Flatten',
  dropout: 'Dropout',
  output: 'Output',
};

export const DEFAULT_LAYER_PARAMS: Record<LayerType, Record<string, number | string>> = {
  input: {},
  dense: { units: 64 },
  conv2d: { filters: 32, kernelSize: 3, stride: 1, padding: 'same' },
  maxpool2d: { poolSize: 2, stride: 2 },
  flatten: {},
  dropout: { rate: 0.5 },
  output: { units: 10 },
};

export function createEmptyArchitecture(name = 'Untitled Network'): NetworkArchitecture {
  const now = new Date().toISOString();
  const inputId = generateId();
  return {
    id: generateId(),
    name,
    version: 1,
    inputShape: [28, 28, 1],
    layers: [
      {
        id: inputId,
        type: 'input',
        name: 'Input',
        params: {},
        position: { x: 0, y: 200 },
        nodeCount: 1,
      },
    ],
    edges: [],
    metadata: { createdAt: now, updatedAt: now },
  };
}

export function createLayer(
  type: LayerType,
  position: { x: number; y: number },
  overrides?: Partial<LayerConfig>,
): LayerConfig {
  return {
    id: generateId(),
    type,
    name: LAYER_TYPE_LABELS[type],
    params: { ...DEFAULT_LAYER_PARAMS[type] },
    activation: type === 'dense' || type === 'output' ? 'relu' : undefined,
    position,
    nodeCount: type === 'dense' ? Number(DEFAULT_LAYER_PARAMS.dense.units) : undefined,
    ...overrides,
  };
}
