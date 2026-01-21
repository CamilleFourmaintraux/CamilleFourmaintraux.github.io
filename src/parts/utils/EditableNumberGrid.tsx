import React, { useState } from "react";

export interface EditableNumberGridProps {
  value: number[][];
  onChange?: (newValue: number[][]) => void;
  cellSize?: number;
  inputStep?: number;
  inputMin?: number;
  inputMax?: number;
  className?: string;
}

const EditableNumberGrid: React.FC<EditableNumberGridProps> = ({
  value,
  onChange,
  cellSize = 40,
  inputStep = 1,
  inputMin,
  inputMax,
  className,
}) => {
  const [matrix, setMatrix] = useState<number[][]>(value);

  const updateCell = (row: number, col: number, newVal: string) => {
    const parsed = parseFloat(newVal);
    const updated = matrix.map((r, i) =>
      r.map((c, j) =>
        i === row && j === col ? (isNaN(parsed) ? 0 : parsed) : c
      )
    );

    setMatrix(updated);
    onChange?.(updated);
  };

  return (
    <div className={className} style={{ display: "inline-block" }}>
      {matrix.map((row, rowIndex) => (
        <div style={{ display: "flex" }} key={rowIndex}>
          {row.map((cell, colIndex) => (
            <input
              key={colIndex}
              type="number"
              value={cell}
              step={inputStep}
              min={inputMin}
              max={inputMax}
              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
              style={{
                width: cellSize,
                height: cellSize,
                textAlign: "center",
                margin: 1,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default EditableNumberGrid;
