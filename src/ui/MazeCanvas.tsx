import { useEffect, useRef } from "react";
import { onThemeChange } from "@/lib/theme";
import { prefersReducedMotion } from "./motion";

type Props = {
  /** Size of a maze cell, in CSS pixels. */
  cell?: number;
  /** Traces the way from the entrance to the pointer. */
  interactive?: boolean;
  className?: string;
};

const NORTH = 1;
const EAST = 2;
const SOUTH = 4;
const WEST = 8;
const CARVE_MS = 1500;
const SOLVE_MS = 900;

type Maze = {
  cols: number;
  rows: number;
  /** Open sides of each cell, as a bit mask. */
  open: Uint8Array;
  /** Cell each cell was reached from: following it leads to the entrance. */
  parent: Int32Array;
  /** Cells in the order the generator visited them. */
  order: Int32Array;
};

// Randomized depth-first search (recursive backtracker), without recursion.
function generateMaze(cols: number, rows: number): Maze {
  const count = cols * rows;
  const open = new Uint8Array(count);
  const parent = new Int32Array(count).fill(-1);
  const order = new Int32Array(count);
  const visited = new Uint8Array(count);
  const stack = [0];
  let visits = 0;
  visited[0] = 1;
  order[visits++] = 0;

  while (stack.length > 0) {
    const cell = stack[stack.length - 1];
    const x = cell % cols;
    const y = (cell - x) / cols;
    const moves: [number, number, number][] = [];
    if (y > 0 && !visited[cell - cols]) moves.push([cell - cols, NORTH, SOUTH]);
    if (x < cols - 1 && !visited[cell + 1]) moves.push([cell + 1, EAST, WEST]);
    if (y < rows - 1 && !visited[cell + cols])
      moves.push([cell + cols, SOUTH, NORTH]);
    if (x > 0 && !visited[cell - 1]) moves.push([cell - 1, WEST, EAST]);
    if (moves.length === 0) {
      stack.pop();
      continue;
    }
    const [next, side, opposite] =
      moves[Math.floor(Math.random() * moves.length)];
    open[cell] |= side;
    open[next] |= opposite;
    parent[next] = cell;
    visited[next] = 1;
    order[visits++] = next;
    stack.push(next);
  }
  return { cols, rows, open, parent, order };
}

/** Decorative maze, generated in the browser and solved towards the pointer. */
export default function MazeCanvas({
  cell = 28,
  interactive,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduced = prefersReducedMotion();
    let maze: Maze | null = null;
    let width = 0;
    let height = 0;
    let offsetX = 0;
    let offsetY = 0;
    let frame = 0;
    let carved = 0;
    let target = -1;
    let following = false;
    let solveStart = 0;
    let colors = { wall: "#999", path: "#c60" };

    const readColors = () => {
      const style = getComputedStyle(canvas);
      colors = {
        wall: style.getPropertyValue("--maze-wall").trim() || colors.wall,
        path: style.getPropertyValue("--maze-path").trim() || colors.path,
      };
    };

    const centerOf = (index: number, m: Maze) => ({
      x: offsetX + ((index % m.cols) + 0.5) * cell,
      y: offsetY + (Math.floor(index / m.cols) + 0.5) * cell,
    });

    const draw = (now: number) => {
      const m = maze;
      if (!m) return;
      context.clearRect(0, 0, width, height);

      context.beginPath();
      for (let i = 0; i < carved; i++) {
        const index = m.order[i];
        const x = offsetX + (index % m.cols) * cell;
        const y = offsetY + Math.floor(index / m.cols) * cell;
        const sides = m.open[index];
        if (!(sides & NORTH)) {
          context.moveTo(x, y);
          context.lineTo(x + cell, y);
        }
        if (!(sides & WEST)) {
          context.moveTo(x, y);
          context.lineTo(x, y + cell);
        }
        if (!(sides & SOUTH)) {
          context.moveTo(x, y + cell);
          context.lineTo(x + cell, y + cell);
        }
        if (!(sides & EAST)) {
          context.moveTo(x + cell, y);
          context.lineTo(x + cell, y + cell);
        }
      }
      context.lineWidth = 1.5;
      context.lineCap = "square";
      context.strokeStyle = colors.wall;
      context.stroke();

      const carving = carved < m.order.length;
      if (carving) {
        const head = centerOf(m.order[Math.max(0, carved - 1)], m);
        const size = cell * 0.5;
        context.fillStyle = colors.path;
        context.fillRect(head.x - size / 2, head.y - size / 2, size, size);
        return;
      }

      // Way from the entrance to the target, walked back through the parents.
      const cells: number[] = [];
      for (let index = target; index !== -1; index = m.parent[index])
        cells.push(index);
      cells.reverse();
      const progress = reduced ? 1 : Math.min(1, (now - solveStart) / SOLVE_MS);
      const shown = Math.max(1, Math.round(cells.length * progress));
      context.beginPath();
      for (let i = 0; i < shown; i++) {
        const point = centerOf(cells[i], m);
        if (i === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      }
      context.lineWidth = Math.max(2, cell * 0.09);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = colors.path;
      // The default way to the exit stays discreet, the one that follows
      // the pointer is drawn at full strength.
      context.globalAlpha = following ? 1 : 0.45;
      context.stroke();
      context.globalAlpha = 1;
      const end = centerOf(cells[shown - 1], m);
      const size = cell * 0.4;
      context.fillStyle = colors.path;
      context.fillRect(end.x - size / 2, end.y - size / 2, size, size);
      if (progress < 1) frame = requestAnimationFrame(draw);
    };

    const carve = () => {
      const m = maze;
      if (!m) return;
      const perFrame = Math.max(
        1,
        Math.ceil(m.order.length / ((CARVE_MS / 1000) * 60)),
      );
      carved = Math.min(m.order.length, carved + perFrame);
      if (carved < m.order.length) {
        draw(performance.now());
        frame = requestAnimationFrame(carve);
      } else {
        solveStart = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    // Sizes the canvas, and builds a new maze when the grid changed.
    const setup = (animate: boolean) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const cols = Math.max(2, Math.floor(rect.width / cell));
      const rows = Math.max(2, Math.floor(rect.height / cell));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      offsetX = (width - cols * cell) / 2;
      offsetY = (height - rows * cell) / 2;
      readColors();

      if (!maze || maze.cols !== cols || maze.rows !== rows) {
        cancelAnimationFrame(frame);
        maze = generateMaze(cols, rows);
        target = cols * rows - 1;
        following = false;
        if (animate && !reduced) {
          carved = 0;
          frame = requestAnimationFrame(carve);
          return;
        }
        carved = maze.order.length;
        solveStart = -SOLVE_MS;
      }
      if (carved === maze.order.length) draw(performance.now());
    };

    setup(true);
    const resizeObserver = new ResizeObserver(() => {
      // A resize during the opening animation restarts it on the new grid.
      setup(maze !== null && carved < maze.order.length);
    });
    resizeObserver.observe(canvas);

    const stopThemeListener = onThemeChange(() => {
      readColors();
      if (maze && carved === maze.order.length) draw(performance.now());
    });

    const area = canvas.parentElement;
    const retarget = (next: number) => {
      if (!maze || carved < maze.order.length) return;
      target = next;
      solveStart = -SOLVE_MS;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => draw(performance.now()));
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!maze || event.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left - offsetX) / cell);
      const y = Math.floor((event.clientY - rect.top - offsetY) / cell);
      if (x < 0 || y < 0 || x >= maze.cols || y >= maze.rows) return;
      following = true;
      retarget(y * maze.cols + x);
    };
    const onPointerLeave = () => {
      following = false;
      if (maze) retarget(maze.cols * maze.rows - 1);
    };
    if (interactive && area) {
      area.addEventListener("pointermove", onPointerMove, { passive: true });
      area.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      stopThemeListener();
      area?.removeEventListener("pointermove", onPointerMove);
      area?.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [cell, interactive]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
