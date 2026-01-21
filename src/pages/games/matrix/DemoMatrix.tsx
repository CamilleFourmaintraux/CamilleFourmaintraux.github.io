import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import EditableNumberGrid from "../../../parts/utils/EditableNumberGrid";

function createEmptyMatrix(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;

  const augmented = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let i = 0; i < n; i++) {
    let pivot = augmented[i][i];

    if (pivot === 0) {
      let swapRow = i + 1;
      while (swapRow < n && augmented[swapRow][i] === 0) swapRow++;
      if (swapRow === n) return null;

      [augmented[i], augmented[swapRow]] = [augmented[swapRow], augmented[i]];
      pivot = augmented[i][i];
    }

    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }

    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = augmented[r][i];
        for (let c = 0; c < 2 * n; c++) {
          augmented[r][c] -= factor * augmented[i][c];
        }
      }
    }
  }

  return augmented.map((row) => row.slice(n));
}

function determinant(matrix: number[][]): number {
  const n = matrix.length;
  const m = matrix.map((row) => [...row]);
  let det = 1;

  for (let i = 0; i < n; i++) {
    let pivot = m[i][i];

    if (pivot === 0) {
      let swapRow = i + 1;
      while (swapRow < n && m[swapRow][i] === 0) swapRow++;
      if (swapRow === n) return 0;

      [m[i], m[swapRow]] = [m[swapRow], m[i]];
      det *= -1;
      pivot = m[i][i];
    }

    det *= pivot;

    for (let j = i + 1; j < n; j++) {
      const factor = m[j][i] / pivot;
      for (let k = i; k < n; k++) {
        m[j][k] -= factor * m[i][k];
      }
    }
  }

  return det;
}

export default function DemoMatrixPage() {
  const [size, setSize] = useState(3);
  const [matrix, setMatrix] = useState(createEmptyMatrix(3));
  const [detValue, setDetValue] = useState<number | null>(null);

  const updateSize = (newSize: number) => {
    if (newSize < 1) return;
    setSize(newSize);
    setMatrix(createEmptyMatrix(newSize));
    setDetValue(null);
  };

  const handleTranspose = () => {
    setMatrix(transpose(matrix));
    setDetValue(null);
  };

  const handleReset = () => {
    setMatrix(createEmptyMatrix(size));
    setDetValue(null);
  };

  const handleDeterminant = () => {
    setDetValue(determinant(matrix));
  };

  const inverseMatrix = useMemo(() => invertMatrix(matrix), [matrix]);

  const { t } = useTranslation();

  return (
    <div className="container">
      <h2>Matrices</h2>

      <label>
        Taille :{" "}
        <input
          type="number"
          min={1}
          max={20}
          value={size}
          onChange={(e) => updateSize(Number(e.target.value))}
        />
      </label>

      <div
        style={{
          display: "flex",
          gap: 40,
          marginTop: 20,
          alignItems: "flex-start",
        }}
      >
        <div>
          <h4>Matrice A</h4>
          <EditableNumberGrid
            value={matrix}
            onChange={setMatrix}
            cellSize={60}
            inputStep={1}
          />
        </div>

        {inverseMatrix && (
          <div>
            <h4>A⁻¹</h4>
            <EditableNumberGrid value={inverseMatrix} cellSize={60} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={handleTranspose}>Transposer A</button>
        <button onClick={handleDeterminant}>Calculer det(A)</button>
        <button onClick={handleReset}>Reset</button>
      </div>

      {detValue !== null && (
        <p style={{ marginTop: 10 }}>
          <strong>det(A) = </strong>
          {detValue.toFixed(4)}
        </p>
      )}

      {!inverseMatrix && (
        <p style={{ marginTop: 10, color: "red" }}>
          La matrice n'est pas inversible
        </p>
      )}

      <NavLink to="/"> {t("test.back")}</NavLink>
    </div>
  );
}
