export type Matrix = number[][];

const EPSILON = 1e-10;

export function identityMatrix(size: number): Matrix {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0)),
  );
}

/** Square matrix of random integers between -9 and 9. */
export function randomMatrix(size: number): Matrix {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.floor(Math.random() * 19) - 9),
  );
}

export function transpose(matrix: Matrix): Matrix {
  if (matrix.length === 0) return [];
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

// Row with the largest value in the column, for numerical stability.
function pivotRow(matrix: Matrix, column: number): number {
  let best = column;
  for (let row = column + 1; row < matrix.length; row++) {
    if (Math.abs(matrix[row][column]) > Math.abs(matrix[best][column]))
      best = row;
  }
  return best;
}

/** Gauss-Jordan elimination. Returns null when the matrix is singular. */
export function invert(matrix: Matrix): Matrix | null {
  const size = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: size }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let i = 0; i < size; i++) {
    const swap = pivotRow(augmented, i);
    if (Math.abs(augmented[swap][i]) < EPSILON) return null;
    [augmented[i], augmented[swap]] = [augmented[swap], augmented[i]];

    const pivot = augmented[i][i];
    for (let column = 0; column < 2 * size; column++)
      augmented[i][column] /= pivot;

    for (let row = 0; row < size; row++) {
      if (row === i) continue;
      const factor = augmented[row][i];
      for (let column = 0; column < 2 * size; column++) {
        augmented[row][column] -= factor * augmented[i][column];
      }
    }
  }
  return augmented.map((row) => row.slice(size));
}

export function determinant(matrix: Matrix): number {
  const size = matrix.length;
  const work = matrix.map((row) => [...row]);
  let result = 1;

  for (let i = 0; i < size; i++) {
    const swap = pivotRow(work, i);
    if (Math.abs(work[swap][i]) < EPSILON) return 0;
    if (swap !== i) {
      [work[i], work[swap]] = [work[swap], work[i]];
      result = -result;
    }
    const pivot = work[i][i];
    result *= pivot;
    for (let row = i + 1; row < size; row++) {
      const factor = work[row][i] / pivot;
      for (let column = i; column < size; column++) {
        work[row][column] -= factor * work[i][column];
      }
    }
  }
  return result;
}

/** Rounds away floating-point noise such as -0 or 0.30000000000000004. */
export function tidy(value: number, digits = 3): number {
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? 0 : rounded;
}
