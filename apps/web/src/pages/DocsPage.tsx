import { LAYER_TYPE_LABELS, type LayerType } from '@nnviz/shared';
import { getLayerFormula } from '@nnviz/nn-math';
import { MathBlock } from '@/components/MathBlock';
import { VantaPageLayout } from '@/components/layout/VantaPageLayout';

const LAYER_DESCRIPTIONS: Record<LayerType, string> = {
  input: 'Receives raw data. Define input shape as [H, W, C] for images or [features] for vectors.',
  dense: 'Fully connected layer. Computes y = σ(Wx + b). Each neuron connects to all inputs.',
  conv2d: 'Convolutional layer. Applies learnable filters over spatial dimensions. Great for images.',
  maxpool2d: 'Downsamples by taking maximum value in each pooling window. Reduces spatial dimensions.',
  flatten: 'Reshapes multi-dimensional tensor into 1D vector for dense layers.',
  dropout: 'Randomly zeroes neurons during training to prevent overfitting. No params.',
  output: 'Final layer producing predictions. Often uses softmax for classification.',
};

export function DocsPage() {
  const types = Object.keys(LAYER_TYPE_LABELS) as LayerType[];

  return (
    <VantaPageLayout className="pb-10">
      <div className="space-y-8 py-8 sm:py-10">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Reference</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Layer types
          </h1>
          <p className="mt-2 text-muted-foreground">
            Quick reference for supported layer types and their math.
          </p>
        </div>

        {types.map((type) => (
          <section key={type} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold">{LAYER_TYPE_LABELS[type]}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{LAYER_DESCRIPTIONS[type]}</p>
            <div className="mt-4">
              <MathBlock formula={getLayerFormula(type)} />
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Training demo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The training demo walks through a single iteration on XOR data: forward pass → loss →
            backward pass → weight update. Illustrative only — no real training loop runs.
          </p>
          <div className="mt-4">
            <MathBlock formula={"w^{\\prime} = w - \\eta \\cdot \\frac{\\partial L}{\\partial w}"} />
          </div>
        </section>
      </div>
    </VantaPageLayout>
  );
}
