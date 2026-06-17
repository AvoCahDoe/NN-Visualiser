import type { DemoState, DemoStep } from '@nnviz/shared';
import { generateId } from '@nnviz/shared';

const XOR_INPUTS = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

const XOR_TARGETS = [0, 1, 1, 0];

function relu(x: number): number {
  return Math.max(0, x);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function mse(predicted: number, target: number): number {
  return 0.5 * (predicted - target) ** 2;
}

interface TinyNetwork {
  w1: number[][];
  b1: number[];
  w2: number[];
  b2: number;
}

function initNetwork(): TinyNetwork {
  return {
    w1: [
      [0.5, -0.3],
      [-0.2, 0.8],
    ],
    b1: [0.1, -0.1],
    w2: [0.4, -0.6],
    b2: 0.05,
  };
}

function forward(net: TinyNetwork, input: number[]): { hidden: number[]; output: number } {
  const hidden = net.w1.map((row, i) =>
    relu(row[0] * input[0] + row[1] * input[1] + net.b1[i]),
  );
  const output = sigmoid(
    net.w2[0] * hidden[0] + net.w2[1] * hidden[1] + net.b2,
  );
  return { hidden, output };
}

export function createDemoState(learningRate = 0.5): DemoState {
  const net = initNetwork();
  const input = XOR_INPUTS[0];
  const target = XOR_TARGETS[0];
  const { hidden, output } = forward(net, input);
  const loss = mse(output, target);

  const steps: DemoStep[] = [
    {
      type: 'forward',
      index: 0,
      title: 'Forward Pass',
      description: `Compute hidden activations and output for input [${input.join(', ')}].`,
      formula: 'h = \\text{ReLU}(W_1 x + b_1),\\; \\hat{y} = \\sigma(W_2 h + b_2)',
      values: {
        input,
        w1: net.w1,
        b1: net.b1,
        w2: net.w2,
        b2: net.b2,
      },
      activations: {
        h0: hidden[0],
        h1: hidden[1],
        output,
      },
    },
    {
      type: 'loss',
      index: 1,
      title: 'Compute Loss',
      description: `Compare prediction ${output.toFixed(4)} with target ${target}.`,
      formula: 'L = \\frac{1}{2}(\\hat{y} - y)^2',
      loss,
      values: { predicted: output, target },
    },
    {
      type: 'backward',
      index: 2,
      title: 'Backward Pass',
      description: 'Compute gradients via chain rule.',
      formula: '\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial w}',
      gradients: {
        dL_dy: output - target,
        dw2_h0: (output - target) * hidden[0],
        dw2_h1: (output - target) * hidden[1],
        db2: output - target,
      },
    },
    {
      type: 'update',
      index: 3,
      title: 'Weight Update',
      description: `Apply gradient descent with learning rate η = ${learningRate}.`,
      formula: "w^{\\prime} = w - \\eta \\cdot \\frac{\\partial L}{\\partial w}",
      weights: {
        w2_0_before: net.w2[0],
        w2_0_new: net.w2[0] - learningRate * (output - target) * hidden[0],
        w2_1_before: net.w2[1],
        w2_1_new: net.w2[1] - learningRate * (output - target) * hidden[1],
        b2_old: net.b2,
        b2_new: net.b2 - learningRate * (output - target),
      },
    },
    {
      type: 'complete',
      index: 4,
      title: 'Step Complete',
      description: 'One training iteration finished. Repeat for more samples or epochs.',
      formula: '\\text{forward} \\rightarrow \\text{loss} \\rightarrow \\text{backward} \\rightarrow \\text{update}',
    },
  ];

  return {
    id: generateId(),
    learningRate,
    currentStep: 0,
    totalSteps: steps.length,
    steps,
    network: {
      layers: [
        { id: 'input', units: 2, activation: 'linear' },
        { id: 'hidden', units: 2, activation: 'relu' },
        { id: 'output', units: 1, activation: 'sigmoid' },
      ],
      weights: {
        w1_00: net.w1[0][0],
        w1_01: net.w1[0][1],
        w1_10: net.w1[1][0],
        w1_11: net.w1[1][1],
        w2_0: net.w2[0],
        w2_1: net.w2[1],
        b2: net.b2,
      },
    },
  };
}

export function getDemoStep(state: DemoState, stepIndex: number): DemoStep | null {
  if (stepIndex < 0 || stepIndex >= state.steps.length) return null;
  return state.steps[stepIndex];
}

export function advanceDemoStep(state: DemoState): DemoState {
  const nextStep = Math.min(state.currentStep + 1, state.totalSteps - 1);
  return { ...state, currentStep: nextStep };
}

export function resetDemoState(state: DemoState): DemoState {
  return { ...state, currentStep: 0 };
}

export { XOR_INPUTS, XOR_TARGETS };
