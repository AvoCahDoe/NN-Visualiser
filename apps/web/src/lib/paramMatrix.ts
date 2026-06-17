/** Deterministic pseudo-random matrix for visualization (seed from layer ids). */
export function generatePreviewMatrix(rows: number, cols: number, seed: string): number[][] {
  const maxRows = Math.min(rows, 8);
  const maxCols = Math.min(cols, 8);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;

  const matrix: number[][] = [];
  for (let r = 0; r < maxRows; r++) {
    const row: number[] = [];
    for (let c = 0; c < maxCols; c++) {
      h = (Math.imul(h ^ (r + 1), 1664525) + 1013904223 + c) | 0;
      row.push(((h >>> 0) % 200 - 100) / 100);
    }
    matrix.push(row);
  }
  return matrix;
}

export function matrixColor(value: number): string {
  if (value > 0) return `rgba(99, 102, 168, ${0.25 + value * 0.65})`;
  return `rgba(248, 113, 113, ${0.25 + Math.abs(value) * 0.65})`;
}
