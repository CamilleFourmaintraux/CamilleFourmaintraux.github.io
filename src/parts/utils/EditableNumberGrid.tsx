import React from "react";

export interface EditableNumberGridProps {
  value: number[][];
  onChange?: (newValue: number[][]) => void;
  cellSize?: number;
  cellMargin?: number;
  inputStep?: number;
  inputMin?: number;
  inputMax?: number;
  className?: string;
}

const EditableNumberGrid: React.FC<EditableNumberGridProps> = ({
  value,
  onChange,
  cellSize = 60,
  cellMargin = 1,
  inputStep = 1,
  inputMin,
  inputMax,
  className,
}) => {
  const updateCell = (row: number, col: number, newVal: string) => {
    const parsed = parseFloat(newVal);

    const updated = value.map((r, i) =>
      r.map((c, j) =>
        i === row && j === col ? (isNaN(parsed) ? 0 : parsed) : c,
      ),
    );

    onChange?.(updated);
  };

  return (
    <div className={"matrix " + className}>
      {value.map((row, rowIndex) => (
        <div className="matrix_inputs_wrapper" key={rowIndex}>
          {row.map((cell, colIndex) => (
            <input
              className="matrix_inputs"
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
                margin: cellMargin,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default EditableNumberGrid;
