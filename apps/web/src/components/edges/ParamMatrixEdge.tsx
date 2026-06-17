import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { generatePreviewMatrix, matrixColor } from '@/lib/paramMatrix';

export interface ParamMatrixEdgeData {
  matrixRows: number;
  matrixCols: number;
  matrixLabel: string;
  showMatrix: boolean;
  seed: string;
  [key: string]: unknown;
}

export function ParamMatrixEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  style,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as ParamMatrixEdgeData | undefined;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const preview =
    edgeData?.showMatrix && edgeData.matrixRows && edgeData.matrixCols
      ? generatePreviewMatrix(edgeData.matrixRows, edgeData.matrixCols, edgeData.seed)
      : null;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {preview ? (
            <div className="rounded-md border border-border bg-card/95 p-1.5 shadow-md backdrop-blur-sm">
              <div className="mb-1 text-center font-mono text-[9px] text-muted-foreground">
                {edgeData!.matrixRows}×{edgeData!.matrixCols}
              </div>
              <div
                className="grid gap-px"
                style={{
                  gridTemplateColumns: `repeat(${preview[0]?.length ?? 1}, 8px)`,
                }}
              >
                {preview.flatMap((row, ri) =>
                  row.map((val, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      className="h-2 w-2 rounded-[1px]"
                      style={{ backgroundColor: matrixColor(val) }}
                      title={val.toFixed(2)}
                    />
                  )),
                )}
              </div>
            </div>
          ) : (
            label && (
              <span className="rounded bg-card/90 px-1.5 py-0.5 text-[10px] text-muted-foreground shadow-sm">
                {label}
              </span>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
