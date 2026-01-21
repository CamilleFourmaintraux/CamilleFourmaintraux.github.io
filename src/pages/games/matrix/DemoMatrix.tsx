import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import EditableNumberGrid from "../../../parts/utils/EditableNumberGrid";

function createEmptyMatrix(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export default function DemoMatrixPage() {
  const [size, setSize] = useState(3); //TODO ERROR HERE MATRIX SHOULD BE VARIABLE
  const [matrix, setMatrix] = useState(createEmptyMatrix(size));

  const updateSize = (newSize: number) => {
    setSize(newSize);
    setMatrix(createEmptyMatrix(newSize)); // ← génère automatiquement une nouvelle matrice NxN vide
  };
  const { t } = useTranslation();
  return (
    <div className="container">
      <h2>Matrice dynamique éditable</h2>

      <label>
        Taille :{" "}
        <input
          type="number"
          min={1}
          max={20}
          value={size}
          onChange={(e) => updateSize(parseInt(e.target.value))}
        />
      </label>

      <div style={{ marginTop: 20 }}>
        <EditableNumberGrid
          value={matrix}
          onChange={setMatrix}
          cellSize={100}
          inputStep={0.01}
          inputMin={0}
          inputMax={99}
        />
      </div>

      <p>{t("test.main")}</p>
      <NavLink to="/"> {t("test.back")}</NavLink>
    </div> //<pre>{JSON.stringify(matrix, null, 2)}</pre>
  );
}
