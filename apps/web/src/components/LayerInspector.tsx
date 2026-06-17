import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  computeShapeChain,
  validateArchitecture,
  getLayerFormula,
  formatShape,
  getConnectionMatrixSpec,
} from '@nnviz/nn-math';
import { LAYER_TYPE_LABELS, type LayerConfig, type LayerType } from '@nnviz/shared';
import { useNetworkStore } from '@/store/networkStore';
import { MathBlock } from './MathBlock';
import { Button } from '@/components/ui/button';
import { LAYER_ICONS, getLayerDisplayName } from '@/lib/layerIcons';
import { generatePreviewMatrix, matrixColor } from '@/lib/paramMatrix';

const EDITABLE_PARAMS: Partial<Record<LayerType, string[]>> = {
  dense: ['units'],
  conv2d: ['filters', 'kernelSize', 'stride', 'padding'],
  maxpool2d: ['poolSize', 'stride'],
  dropout: ['rate'],
  output: ['units'],
};

type LayerForm = LayerConfig & { inputShapeStr?: string };

export function LayerInspector() {
  const architecture = useNetworkStore((s) => s.getActiveArchitecture());
  const selectedLayerId = useNetworkStore((s) => s.selectedLayerId);
  const updateLayer = useNetworkStore((s) => s.updateLayer);
  const setInputShape = useNetworkStore((s) => s.setInputShape);
  const showParamMatrices = useNetworkStore((s) => s.showParamMatrices);

  const layer = architecture?.layers.find((l) => l.id === selectedLayerId);
  const layerIndex = architecture?.layers.findIndex((l) => l.id === selectedLayerId) ?? -1;

  const validation = useMemo(
    () => (architecture ? validateArchitecture(architecture) : null),
    [architecture],
  );

  const shapes = useMemo(
    () => (architecture ? computeShapeChain(architecture) : []),
    [architecture],
  );

  const layerShape = shapes.find((s) => s.layerId === selectedLayerId);

  const incomingMatrix = useMemo(() => {
    if (!architecture || layerIndex <= 0) return null;
    const prev = architecture.layers[layerIndex - 1];
    if (!selectedLayerId || !prev) return null;
    return getConnectionMatrixSpec(prev.id, selectedLayerId, shapes);
  }, [architecture, layerIndex, selectedLayerId, shapes]);

  const matrixPreview = useMemo(() => {
    if (!incomingMatrix || !architecture || layerIndex <= 0) return null;
    const prev = architecture.layers[layerIndex - 1]!;
    return generatePreviewMatrix(incomingMatrix.rows, incomingMatrix.cols, `${prev.id}-${selectedLayerId}`);
  }, [incomingMatrix, architecture, layerIndex, selectedLayerId]);

  const formDefaults: LayerForm | undefined = layer
    ? {
        ...layer,
        inputShapeStr:
          layer.type === 'input' && architecture
            ? architecture.inputShape.join(', ')
            : undefined,
      }
    : undefined;

  const { register, handleSubmit } = useForm<LayerForm>({
    values: formDefaults,
  });

  if (!architecture) {
    return (
      <aside className="w-72 border-l border-border bg-card p-4 text-sm text-muted-foreground">
        No project selected
      </aside>
    );
  }

  const onSubmit = (data: LayerForm) => {
    if (!selectedLayerId) return;

    if (layer?.type === 'input' && data.inputShapeStr) {
      const parsed = data.inputShapeStr
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (parsed.length > 0) setInputShape(parsed);
    }

    updateLayer(selectedLayerId, {
      name: data.name,
      params: data.params,
      activation: data.activation,
      nodeCount: data.params.units ? Number(data.params.units) : data.nodeCount,
    });
  };

  const Icon = layer ? LAYER_ICONS[layer.type] : null;

  return (
    <aside className="flex w-72 flex-col overflow-y-auto border-l border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold">Inspector</h2>
        {validation && (
          <div className={`mt-2 text-xs ${validation.valid ? 'text-success' : 'text-destructive'}`}>
            {validation.valid
              ? `Valid · ${validation.totalParams.toLocaleString()} params`
              : `${validation.errors.length} error(s)`}
          </div>
        )}
      </div>

      {!layer ? (
        <div className="p-4 text-sm text-muted-foreground">Select a layer to inspect</div>
      ) : (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div>
              <div className="text-xs uppercase text-muted-foreground">Type</div>
              <div className="font-medium">{LAYER_TYPE_LABELS[layer.type]}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Layer name</label>
              <input
                {...register('name')}
                placeholder={LAYER_TYPE_LABELS[layer.type]}
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            {layer.type === 'input' && (
              <div>
                <label className="text-xs text-muted-foreground">Input shape (comma-separated)</label>
                <input
                  {...register('inputShapeStr')}
                  placeholder="28, 28, 1"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 font-mono text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            )}

            {(EDITABLE_PARAMS[layer.type] ?? []).map((param) => (
              <div key={param}>
                <label className="text-xs capitalize text-muted-foreground">{param}</label>
                <input
                  {...register(`params.${param}`)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            ))}

            {(layer.type === 'dense' || layer.type === 'output') && (
              <div>
                <label className="text-xs text-muted-foreground">Activation</label>
                <select
                  {...register('activation')}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="relu">ReLU</option>
                  <option value="sigmoid">Sigmoid</option>
                  <option value="tanh">Tanh</option>
                  <option value="softmax">Softmax</option>
                  <option value="linear">Linear</option>
                </select>
              </div>
            )}

            <Button type="submit" className="w-full">
              Apply Changes
            </Button>
          </form>

          {layerShape && (
            <div>
              <div className="text-xs uppercase text-muted-foreground">Output Shape</div>
              <div className="font-mono text-primary">{formatShape(layerShape.outputShape)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {layerShape.paramCount.toLocaleString()} parameters
              </div>
            </div>
          )}

          {incomingMatrix && (showParamMatrices || layerIndex > 0) && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="text-xs font-medium text-muted-foreground">Weight matrix (from prev layer)</div>
              <div className="mt-1 font-mono text-sm text-primary">
                {incomingMatrix.rows} × {incomingMatrix.cols}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {incomingMatrix.paramCount.toLocaleString()} params
              </div>
              {matrixPreview && showParamMatrices && (
                <div
                  className="mt-2 grid gap-0.5"
                  style={{ gridTemplateColumns: `repeat(${matrixPreview[0]?.length ?? 1}, 12px)` }}
                >
                  {matrixPreview.flatMap((row, ri) =>
                    row.map((val, ci) => (
                      <div
                        key={`${ri}-${ci}`}
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: matrixColor(val) }}
                      />
                    )),
                  )}
                </div>
              )}
              <div className="mt-2">
                <MathBlock formula={incomingMatrix.label} />
              </div>
            </div>
          )}

          <MathBlock formula={getLayerFormula(layer.type)} />
          {layerShape?.formula && <MathBlock formula={layerShape.formula} />}
        </div>
      )}

      <div className="mt-auto border-t border-border p-4">
        <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">Shape Chain</h3>
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {shapes.map((s) => {
            const archLayer = architecture.layers.find((l) => l.id === s.layerId);
            return (
              <div
                key={s.layerId}
                className={`flex justify-between gap-2 font-mono text-xs ${
                  s.layerId === selectedLayerId ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span className="truncate">
                  {archLayer ? getLayerDisplayName(s.layerType, archLayer.name) : LAYER_TYPE_LABELS[s.layerType]}
                </span>
                <span className="shrink-0">{formatShape(s.outputShape)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
