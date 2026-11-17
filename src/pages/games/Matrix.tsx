import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  faShuffle,
  faTableCells,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  determinant,
  identityMatrix,
  invert,
  randomMatrix,
  tidy,
  transpose,
  type Matrix,
} from "@/lib/matrix";
import BackHome from "@/ui/BackHome";
import Icon from "@/ui/Icon";
import Page from "@/ui/Page";

const DEFAULT_SIZE = 3;
const MIN_SIZE = 1;
const MAX_SIZE = 8;

type GridProps = {
  label: string;
  value: Matrix;
  onChange?: (value: Matrix) => void;
};

function MatrixGrid({ label, value, onChange }: GridProps) {
  const update = (row: number, column: number, text: string) => {
    const parsed = Number.parseFloat(text);
    onChange?.(
      value.map((cells, i) =>
        cells.map((cell, j) =>
          i === row && j === column
            ? Number.isNaN(parsed)
              ? 0
              : parsed
            : cell,
        ),
      ),
    );
  };
  return (
    <div className="matrix" role="group" aria-label={label}>
      <h2>{label}</h2>
      <div
        className="matrix-grid"
        style={{ "--size": value.length } as React.CSSProperties}
      >
        {value.flatMap((cells, row) =>
          cells.map((cell, column) => (
            <input
              key={`${row}-${column}`}
              type="number"
              inputMode="decimal"
              step="any"
              name={`cell-${row}-${column}`}
              aria-label={`${label}, ${row + 1}, ${column + 1}`}
              value={onChange ? cell : tidy(cell)}
              readOnly={!onChange}
              onChange={(event) => update(row, column, event.target.value)}
            />
          )),
        )}
      </div>
    </div>
  );
}

export default function MatrixPage() {
  const { t } = useTranslation();
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [matrix, setMatrix] = useState(() => identityMatrix(DEFAULT_SIZE));
  const det = useMemo(() => determinant(matrix), [matrix]);
  const inverse = useMemo(() => invert(matrix), [matrix]);

  const resize = (next: number) => {
    if (!Number.isInteger(next) || next < MIN_SIZE || next > MAX_SIZE) return;
    setSize(next);
    setMatrix(identityMatrix(next));
  };

  return (
    <Page
      title={t("portfolio.passion.games.matrix.matrices")}
      icon={faTableCells}
    >
      <div className="matrix-tool">
        <div className="matrix-settings">
          <label className="matrix-size">
            <span>{t("portfolio.passion.games.matrix.size")}</span>
            <input
              type="number"
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={size}
              onChange={(event) => resize(Number(event.target.value))}
            />
          </label>
          <p className="matrix-det" role="status">
            <strong>det(M)&nbsp;=&nbsp;</strong>
            {tidy(det).toFixed(3)}
          </p>
        </div>

        <div className="matrix-pair">
          <MatrixGrid
            label={t("portfolio.passion.games.matrix.m")}
            value={matrix}
            onChange={setMatrix}
          />
          {inverse ? (
            <MatrixGrid
              label={t("portfolio.passion.games.matrix.m_inverse")}
              value={inverse}
            />
          ) : (
            <p className="form-status is-error" role="status">
              <Icon icon={faTriangleExclamation} />
              {t("portfolio.passion.games.matrix.not_inversible")}
            </p>
          )}
        </div>

        <div className="matrix-actions">
          <button
            type="button"
            className="button"
            onClick={() => setMatrix(transpose(matrix))}
          >
            {t("portfolio.passion.games.matrix.transpose")}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setMatrix(randomMatrix(size))}
          >
            <Icon icon={faShuffle} />
            {t("portfolio.passion.games.matrix.random")}
          </button>
        </div>
      </div>
      <BackHome />
    </Page>
  );
}
