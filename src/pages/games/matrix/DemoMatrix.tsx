import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import EditableNumberGrid from "../../../parts/utils/EditableNumberGrid";

function createEmptyMatrix(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function createIdentityMatrix(size: number): number[][] {
  const result = createEmptyMatrix(size);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i == j) result[i][j] = 1;
    }
  }
  return result;
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

  const minSize = 0;
  const maxSize = 8;

  const updateSize = (newSize: number) => {
    if (newSize < minSize) {
      /*console.error(
        newSize +
          " is an invalid size (must be " +
          newSize +
          ">=" +
          minSize +
          ")",
      );*/
      return;
    }
    if (newSize > maxSize) {
      /*console.error(
        newSize +
          " is an invalid size (must be " +
          newSize +
          "<=" +
          maxSize +
          ")",
      );*/
      return;
    }
    setSize(newSize);
    setMatrix(createEmptyMatrix(newSize));
    setDetValue(null);
  };

  const handleTranspose = () => {
    setMatrix(transpose(matrix));
    setDetValue(null);
  };

  const handleReset = () => {
    setMatrix(createIdentityMatrix(size));
    setDetValue(null);
  };

  const handleDeterminant = () => {
    setDetValue(determinant(matrix));
  };

  const inverseMatrix = useMemo(() => invertMatrix(matrix), [matrix]);

  const { t } = useTranslation();

  return (
    <div className="container">
      <h2>{t("portfolio.passion.games.matrix.matrices")}</h2>

      <label>
        {t("portfolio.passion.games.matrix.size")} :{" "}
        <input
          type="number"
          min={minSize}
          max={maxSize}
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
          <h4>{t("portfolio.passion.games.matrix.m")}</h4>
          <EditableNumberGrid value={matrix} onChange={setMatrix} />
        </div>

        {inverseMatrix && (
          <div>
            <h4>{t("portfolio.passion.games.matrix.m_inverse")}</h4>
            <EditableNumberGrid value={inverseMatrix} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={handleTranspose}>
          {t("portfolio.passion.games.matrix.transpose")}
        </button>
        <button onClick={handleDeterminant}>
          {t("portfolio.passion.games.matrix.det")}
        </button>
        <button onClick={handleReset}>
          {t("portfolio.passion.games.matrix.identity")}
        </button>
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
